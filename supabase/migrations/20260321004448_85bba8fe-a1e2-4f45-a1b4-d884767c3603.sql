
CREATE OR REPLACE FUNCTION public.handle_paystack_webhook(p_webhook_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_payload jsonb;
  v_reference text;
  v_gross_amount numeric;
  v_fee numeric := 50;
  v_net_amount numeric;
  v_user_id uuid;
BEGIN
  SELECT payload, reference INTO v_payload, v_reference 
  FROM public.webhook_events WHERE id = p_webhook_id;

  IF v_payload->>'event' != 'charge.success' THEN
    UPDATE public.webhook_events SET status = 'ignored', processed_at = now() WHERE id = p_webhook_id;
    RETURN;
  END IF;

  v_gross_amount := (v_payload->'data'->>'amount')::numeric / 100;
  v_user_id := (v_payload->'data'->'metadata'->>'user_id')::uuid;

  IF v_gross_amount <= v_fee THEN
    UPDATE public.webhook_events SET status = 'rejected', processed_at = now() WHERE id = p_webhook_id;
    INSERT INTO public.webhook_processing_logs (webhook_id, status, message)
    VALUES (p_webhook_id, 'rejected', format('Deposit of %s is below minimum (must be > %s)', v_gross_amount, v_fee));
    RETURN;
  END IF;

  v_net_amount := v_gross_amount - v_fee;

  INSERT INTO public.transactions (
    user_id, type, amount, status, reference, description, metadata
  ) VALUES (
    v_user_id, 'wallet_fund', v_net_amount, 'success', v_reference, 
    format('Wallet funded (paid %s, fee %s, credited %s)', v_gross_amount, v_fee, v_net_amount),
    jsonb_build_object(
      'gross_amount', v_gross_amount,
      'fee', v_fee,
      'net_amount', v_net_amount,
      'gateway', 'paystack',
      'paystack_data', v_payload->'data'
    )
  ) ON CONFLICT (reference) DO NOTHING;

  UPDATE public.wallets 
  SET balance = balance + v_net_amount, updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.webhook_events 
  SET status = 'processed', processed_at = now() 
  WHERE id = p_webhook_id;

  INSERT INTO public.webhook_processing_logs (webhook_id, status, message)
  VALUES (p_webhook_id, 'success', format('Credited %s (gross %s, fee %s)', v_net_amount, v_gross_amount, v_fee));

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.webhook_processing_logs (webhook_id, status, message, error_code)
  VALUES (p_webhook_id, 'error', SQLERRM, SQLSTATE);
  
  UPDATE public.webhook_events SET status = 'failed' WHERE id = p_webhook_id;
END;
$function$;
