
-- Add transaction pin and deactivation columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS transaction_pin_hash text,
  ADD COLUMN IF NOT EXISTS transaction_pin_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamp with time zone;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  airtime_enabled boolean NOT NULL DEFAULT true,
  data_enabled boolean NOT NULL DEFAULT true,
  cable_tv_enabled boolean NOT NULL DEFAULT true,
  electricity_enabled boolean NOT NULL DEFAULT true,
  bulk_sms_enabled boolean NOT NULL DEFAULT true,
  edu_pins_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  in_app_enabled boolean NOT NULL DEFAULT true,
  transaction_updates boolean NOT NULL DEFAULT true,
  promotions boolean NOT NULL DEFAULT true,
  service_reminders boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Delete user account function (security definer to access auth schema)
CREATE OR REPLACE FUNCTION public.delete_user_account(auth_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to delete their own account
  IF auth.uid() != auth_uid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete from public tables (order matters for FK constraints)
  DELETE FROM public.notification_preferences WHERE user_id = auth_uid;
  DELETE FROM public.referred_users WHERE referrer_id = auth_uid OR referred_user_id = auth_uid;
  DELETE FROM public.referral_codes WHERE user_id = auth_uid;
  DELETE FROM public.transactions WHERE user_id = auth_uid;
  DELETE FROM public.wallets WHERE id = auth_uid;
  DELETE FROM public.profiles WHERE id = auth_uid;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = auth_uid;
END;
$$;
