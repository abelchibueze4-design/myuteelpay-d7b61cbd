-- ── WEBHOOK HANDLERS INFRASTRUCTURE ────────────────────────────────
-- This migration sets up the logic for processing incoming webhooks
-- from Paystack (payments) and KVData (utility services).

-- 0. Update transaction_type enum to include 'refund' and 'data_card'
-- We use a safe check to avoid errors if already present
DO $$ 
BEGIN 
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'refund'; 
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'data_card'; 
END $$;

-- 1. Ensure webhook_events table is correctly configured (if not already)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider      text NOT NULL, -- 'paystack', 'kvdata', 'resend', 'termii'
  event_type    text NOT NULL,
  reference     text,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'received', -- 'received', 'processed', 'failed', 'duplicate'
  processed_at  timestamp with time zone,
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for faster lookups during reconciliation
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_reference_idx 
  ON public.webhook_events(provider, reference, event_type) 
  WHERE reference IS NOT NULL;

-- 2. Create a log table for webhook processing attempts
CREATE TABLE IF NOT EXISTS public.webhook_processing_logs (
  id          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id  uuid REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  status      text NOT NULL, -- 'success', 'error'
  message     text,
  error_code  text,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. FUNCTION: process_paystack_webhook
-- Handles 'charge.success' to automatically fund user wallets
CREATE OR REPLACE FUNCTION public.handle_paystack_webhook(p_webhook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload jsonb;
  v_reference text;
  v_amount numeric;
  v_user_id uuid;
  v_status text;
BEGIN
  -- Fetch payload
  SELECT payload, reference INTO v_payload, v_reference 
  FROM public.webhook_events WHERE id = p_webhook_id;

  -- Only process successful charges
  IF v_payload->>'event' != 'charge.success' THEN
    UPDATE public.webhook_events SET status = 'ignored', processed_at = now() WHERE id = p_webhook_id;
    RETURN;
  END IF;

  v_amount := (v_payload->'data'->>'amount')::numeric / 100; -- Convert kobo to Naira
  v_user_id := (v_payload->'data'->'metadata'->>'user_id')::uuid;

  -- 1. Create transaction record
  INSERT INTO public.transactions (
    user_id, type, amount, status, reference, description, metadata
  ) VALUES (
    v_user_id, 'wallet_fund', v_amount, 'success', v_reference, 
    'Wallet funded via Paystack Webhook', v_payload->'data'
  ) ON CONFLICT (reference) DO NOTHING;

  -- 2. Update wallet balance
  UPDATE public.wallets 
  SET balance = balance + v_amount, updated_at = now()
  WHERE id = v_user_id;

  -- 3. Mark webhook as processed
  UPDATE public.webhook_events 
  SET status = 'processed', processed_at = now() 
  WHERE id = p_webhook_id;

  INSERT INTO public.webhook_processing_logs (webhook_id, status, message)
  VALUES (p_webhook_id, 'success', 'Wallet funded successfully');

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.webhook_processing_logs (webhook_id, status, message, error_code)
  VALUES (p_webhook_id, 'error', SQLERRM, SQLSTATE);
  
  UPDATE public.webhook_events SET status = 'failed' WHERE id = p_webhook_id;
END;
$$;

-- 4. FUNCTION: process_kvdata_webhook
-- Handles transaction status updates (Success/Failed) from KVData
CREATE OR REPLACE FUNCTION public.handle_kvdata_webhook(p_webhook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload jsonb;
  v_reference text;
  v_status text;
  v_amount numeric;
  v_user_id uuid;
BEGIN
  SELECT payload, reference INTO v_payload, v_reference 
  FROM public.webhook_events WHERE id = p_webhook_id;

  -- Map KVData status to our system status
  v_status := CASE 
    WHEN v_payload->>'status' = 'Successful' THEN 'success'
    WHEN v_payload->>'status' = 'Failed' THEN 'failed'
    ELSE 'pending'
  END;

  -- Update transaction status
  UPDATE public.transactions 
  SET status = v_status, metadata = metadata || v_payload
  WHERE reference = v_reference;

  -- If failed, refund the wallet
  IF v_status = 'failed' THEN
    SELECT amount, user_id INTO v_amount, v_user_id 
    FROM public.transactions WHERE reference = v_reference;

    UPDATE public.wallets 
    SET balance = balance + v_amount, updated_at = now()
    WHERE id = v_user_id;

    -- Create refund transaction log
    INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
    VALUES (v_user_id, 'refund', v_amount, 'success', 'Refund for failed transaction ' || v_reference, 'REFUND-' || v_reference);
  END IF;

  UPDATE public.webhook_events 
  SET status = 'processed', processed_at = now() 
  WHERE id = p_webhook_id;

  INSERT INTO public.webhook_processing_logs (webhook_id, status, message)
  VALUES (p_webhook_id, 'success', 'Transaction status updated to ' || v_status);

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.webhook_processing_logs (webhook_id, status, message, error_code)
  VALUES (p_webhook_id, 'error', SQLERRM, SQLSTATE);
  
  UPDATE public.webhook_events SET status = 'failed' WHERE id = p_webhook_id;
END;
$$;

-- 5. Trigger for automated processing
CREATE OR REPLACE FUNCTION public.on_webhook_received()
RETURNS trigger AS $$
BEGIN
  IF NEW.provider = 'paystack' THEN
    PERFORM public.handle_paystack_webhook(NEW.id);
  ELSIF NEW.provider = 'kvdata' THEN
    PERFORM public.handle_kvdata_webhook(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_process_webhook_on_insert
  AFTER INSERT ON public.webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.on_webhook_received();

-- 6. Add RLS Policies for Webhook Tables
ALTER TABLE public.webhook_processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
  ON public.webhook_processing_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins can view webhook events"
  ON public.webhook_events FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
