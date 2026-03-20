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
  ELSIF NEW.provider IN ('paymentpoint', 'xixapay') THEN
    UPDATE public.webhook_events SET status = 'processed', processed_at = now() WHERE id = NEW.id;
    INSERT INTO public.webhook_processing_logs (webhook_id, status, message)
    VALUES (NEW.id, 'success', NEW.provider || ' payment processed via edge function');
  END IF;
  RETURN NEW;
END;
$function$;