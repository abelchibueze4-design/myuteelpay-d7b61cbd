
-- Create VTPass webhook handler function
CREATE OR REPLACE FUNCTION public.handle_vtpass_webhook(p_webhook_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_payload jsonb;
  v_reference text;
  v_status text;
  v_amount numeric;
  v_user_id uuid;
  v_vtpass_code text;
  v_vtpass_status text;
BEGIN
  SELECT payload, reference INTO v_payload, v_reference 
  FROM public.webhook_events WHERE id = p_webhook_id;

  -- Extract VTPass status info
  v_vtpass_code := v_payload->>'code';
  v_vtpass_status := COALESCE(
    v_payload->'content'->'transactions'->>'status',
    v_payload->>'status',
    ''
  );

  -- Map VTPass status to our system status
  v_status := CASE 
    WHEN v_vtpass_code = '000' OR v_vtpass_status IN ('delivered', 'successful') THEN 'success'
    WHEN v_vtpass_code = '016' OR v_vtpass_status = 'failed' THEN 'failed'
    ELSE 'pending'
  END;

  -- Update transaction status
  UPDATE public.transactions 
  SET status = v_status::transaction_status, 
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('vtpass_webhook', v_payload)
  WHERE reference = v_reference;

  -- If failed, refund the wallet
  IF v_status = 'failed' THEN
    SELECT amount, user_id INTO v_amount, v_user_id 
    FROM public.transactions WHERE reference = v_reference;

    IF v_user_id IS NOT NULL AND v_amount IS NOT NULL THEN
      UPDATE public.wallets 
      SET balance = balance + v_amount, updated_at = now()
      WHERE id = v_user_id;

      -- Create refund transaction log
      INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
      VALUES (v_user_id, 'refund', v_amount, 'success', 
              'Refund for failed VTPass transaction ' || v_reference, 
              'REFUND-' || v_reference)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  UPDATE public.webhook_events 
  SET status = 'processed', processed_at = now() 
  WHERE id = p_webhook_id;

  INSERT INTO public.webhook_processing_logs (webhook_id, status, message)
  VALUES (p_webhook_id, 'success', 'VTPass transaction status updated to ' || v_status);

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.webhook_processing_logs (webhook_id, status, message, error_code)
  VALUES (p_webhook_id, 'error', SQLERRM, SQLSTATE);
  
  UPDATE public.webhook_events SET status = 'failed' WHERE id = p_webhook_id;
END;
$function$;

-- Update the webhook trigger function to include vtpass
CREATE OR REPLACE FUNCTION public.on_webhook_received()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.provider = 'paystack' THEN
    PERFORM public.handle_paystack_webhook(NEW.id);
  ELSIF NEW.provider = 'kvdata' THEN
    PERFORM public.handle_kvdata_webhook(NEW.id);
  ELSIF NEW.provider = 'vtpass' THEN
    PERFORM public.handle_vtpass_webhook(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;
