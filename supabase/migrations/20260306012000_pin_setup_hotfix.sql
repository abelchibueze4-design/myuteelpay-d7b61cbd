CREATE OR REPLACE FUNCTION public.set_transaction_pin(p_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
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

  UPDATE public.profiles
  SET
    transaction_pin_hash = crypt(p_pin, gen_salt('bf')),
    transaction_pin_enabled = TRUE,
    updated_at = now()
  WHERE id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_transaction_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_transaction_pin(text) TO service_role;
