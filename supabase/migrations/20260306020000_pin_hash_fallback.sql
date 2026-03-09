CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_transaction_pin(p_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
  v_salt TEXT;
  v_can_use_pgcrypto BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits long';
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (v_user_id, '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (id, balance)
  VALUES (v_user_id, 0)
  ON CONFLICT (id) DO NOTHING;

  v_can_use_pgcrypto :=
    to_regprocedure('gen_salt(text)') IS NOT NULL
    AND to_regprocedure('crypt(text,text)') IS NOT NULL;

  IF v_can_use_pgcrypto THEN
    v_hash := crypt(p_pin, gen_salt('bf'));
  ELSE
    v_salt := substr(md5(v_user_id::text || clock_timestamp()::text || random()::text), 1, 16);
    v_hash := 'md5$' || v_salt || '$' || md5(v_salt || p_pin);
  END IF;

  UPDATE public.profiles
  SET
    transaction_pin_hash = v_hash,
    transaction_pin_enabled = TRUE,
    updated_at = now()
  WHERE id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_enabled BOOLEAN;
  v_salt TEXT;
BEGIN
  SELECT transaction_pin_hash, transaction_pin_enabled
  INTO v_hash, v_enabled
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT COALESCE(v_enabled, FALSE) OR v_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_hash LIKE 'md5$%$%' THEN
    v_salt := split_part(v_hash, '$', 2);
    RETURN v_hash = ('md5$' || v_salt || '$' || md5(v_salt || p_pin));
  END IF;

  IF to_regprocedure('crypt(text,text)') IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_hash = crypt(p_pin, v_hash);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_transaction_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_transaction_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_transaction_pin(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_transaction_pin(text) TO service_role;
