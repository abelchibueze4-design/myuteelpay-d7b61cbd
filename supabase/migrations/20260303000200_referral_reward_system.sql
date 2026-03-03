
-- Function to handle referral rewards
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer_id UUID;
  _referred_full_name TEXT;
BEGIN
  -- Get the referrer ID
  _referrer_id := NEW.referrer_id;

  -- Get the full name of the referred user for the description
  SELECT full_name INTO _referred_full_name FROM public.profiles WHERE id = NEW.referred_user_id;

  -- 1. Update referrer's wallet balance (add #10)
  UPDATE public.wallets
  SET balance = balance + 10,
      updated_at = now()
  WHERE id = _referrer_id;

  -- 2. Create a transaction record for the referral bonus
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    status,
    description,
    metadata
  ) VALUES (
    _referrer_id,
    'referral_bonus',
    10,
    'success',
    'Referral bonus for inviting ' || COALESCE(_referred_full_name, 'a new user'),
    jsonb_build_object('referred_user_id', NEW.referred_user_id)
  );

  RETURN NEW;
END;
$$;

-- Trigger to execute the reward function after a referral is recorded
DROP TRIGGER IF EXISTS on_referral_created ON public.referred_users;
CREATE TRIGGER on_referral_created
  AFTER INSERT ON public.referred_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_reward();
