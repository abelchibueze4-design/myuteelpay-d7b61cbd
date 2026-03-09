
-- Create a trigger function that generates a notification when a transaction is inserted or updated
CREATE OR REPLACE FUNCTION public.notify_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_type_label TEXT;
  v_amount_fmt TEXT;
BEGIN
  -- Only notify on insert or when status changes to success/failed
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Format type label
  v_type_label := INITCAP(REPLACE(NEW.type::text, '_', ' '));
  v_amount_fmt := '₦' || TO_CHAR(ABS(NEW.amount), 'FM999,999,999.00');

  -- Build title and body based on transaction type and status
  IF NEW.status = 'success' THEN
    IF NEW.type = 'wallet_fund' THEN
      v_title := '💰 Wallet Funded';
      v_body := 'Your wallet has been credited with ' || v_amount_fmt || '.';
    ELSIF NEW.type = 'referral_bonus' THEN
      v_title := '🎁 Referral Bonus';
      v_body := 'You received a referral bonus of ' || v_amount_fmt || '.';
    ELSIF NEW.type = 'refund' THEN
      v_title := '↩️ Refund Processed';
      v_body := 'A refund of ' || v_amount_fmt || ' has been credited to your wallet.';
    ELSE
      v_title := '✅ ' || v_type_label || ' Successful';
      v_body := 'Your ' || LOWER(v_type_label) || ' purchase of ' || v_amount_fmt || ' was successful.';
    END IF;
  ELSIF NEW.status = 'failed' THEN
    v_title := '❌ ' || v_type_label || ' Failed';
    v_body := 'Your ' || LOWER(v_type_label) || ' transaction of ' || v_amount_fmt || ' failed. Please try again.';
  ELSIF NEW.status = 'pending' AND TG_OP = 'INSERT' THEN
    v_title := '⏳ ' || v_type_label || ' Processing';
    v_body := 'Your ' || LOWER(v_type_label) || ' transaction of ' || v_amount_fmt || ' is being processed.';
  ELSE
    RETURN NEW;
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (user_id, title, body, type, channel, metadata)
  VALUES (
    NEW.user_id,
    v_title,
    COALESCE(NEW.description, v_body),
    'transaction',
    ARRAY['in_app'],
    jsonb_build_object(
      'transaction_id', NEW.id,
      'transaction_type', NEW.type,
      'amount', NEW.amount,
      'status', NEW.status,
      'reference', NEW.reference
    )
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_notify_on_transaction ON public.transactions;
CREATE TRIGGER trg_notify_on_transaction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_transaction();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
