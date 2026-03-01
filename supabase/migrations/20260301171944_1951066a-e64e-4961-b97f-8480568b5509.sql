
-- Add username and address columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (LOWER(username));

-- Update handle_new_user to include username and address
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _referral_code TEXT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone_number, username, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );

  -- Create wallet
  INSERT INTO public.wallets (id, balance) VALUES (NEW.id, 0);

  -- Generate unique referral code
  _referral_code := UPPER(SUBSTR(MD5(NEW.id::text || now()::text), 1, 8));
  INSERT INTO public.referral_codes (user_id, code) VALUES (NEW.id, _referral_code);

  -- Handle referral if signup included a referral code
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    INSERT INTO public.referred_users (referrer_id, referred_user_id)
    SELECT rc.user_id, NEW.id
    FROM public.referral_codes rc
    WHERE rc.code = NEW.raw_user_meta_data->>'referral_code'
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create a function to look up email by username (for username-based login)
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
BEGIN
  SELECT au.email INTO _email
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE LOWER(p.username) = LOWER(p_username);
  RETURN _email;
END;
$function$;

-- Grant execute to anon and authenticated so login can look up username
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO authenticated;
