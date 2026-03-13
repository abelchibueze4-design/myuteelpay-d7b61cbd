
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _referral_code TEXT;
  _username TEXT;
  _final_username TEXT;
BEGIN
  _username := NEW.raw_user_meta_data->>'username';
  
  -- If username is empty, set to NULL
  IF _username IS NULL OR _username = '' THEN
    _final_username := NULL;
  ELSE
    -- Check if username already exists, if so append random suffix
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
      _final_username := _username || '_' || SUBSTR(MD5(NEW.id::text || now()::text), 1, 4);
    ELSE
      _final_username := _username;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone_number, username, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    _final_username,
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );

  INSERT INTO public.wallets (id, balance) VALUES (NEW.id, 0);

  _referral_code := UPPER(SUBSTR(MD5(NEW.id::text || now()::text), 1, 8));
  INSERT INTO public.referral_codes (user_id, code) VALUES (NEW.id, _referral_code);

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
