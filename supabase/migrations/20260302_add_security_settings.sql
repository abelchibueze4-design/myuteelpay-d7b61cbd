-- Add security-related columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS transaction_pin_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Service type preferences (airtime, data, cable_tv, electricity, bulk_sms, edu_pins)
  airtime_enabled BOOLEAN DEFAULT true,
  data_enabled BOOLEAN DEFAULT true,
  cable_tv_enabled BOOLEAN DEFAULT true,
  electricity_enabled BOOLEAN DEFAULT true,
  bulk_sms_enabled BOOLEAN DEFAULT true,
  edu_pins_enabled BOOLEAN DEFAULT true,
  -- Notification channels
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  -- Notification types
  transaction_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  service_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification preferences
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create notification preferences on profile creation
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating notification preferences
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON public.profiles;
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();
