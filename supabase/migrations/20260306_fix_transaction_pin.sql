-- Fix Transaction PIN Setup
-- This migration ensures all dependencies for the PIN system are correctly installed.

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Ensure columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS transaction_pin_enabled BOOLEAN DEFAULT FALSE;

-- 3. Re-create the setup function with explicit strictness
DROP FUNCTION IF EXISTS public.set_transaction_pin(text);

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

  -- Enforce 4 digits
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits long';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    transaction_pin_hash = crypt(p_pin, gen_salt('bf')),
    transaction_pin_enabled = TRUE,
    updated_at = now()
  WHERE id = v_user_id;

  -- Check if update happened (user might not exist in profiles?)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$;

-- 4. Re-create verification function
DROP FUNCTION IF EXISTS public.verify_transaction_pin(text);

CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_enabled BOOLEAN;
BEGIN
  SELECT transaction_pin_hash, transaction_pin_enabled 
  INTO v_hash, v_enabled
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT v_enabled OR v_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_hash = crypt(p_pin, v_hash);
END;
$$;

-- 5. Grant execute permissions (important for authenticated users)
GRANT EXECUTE ON FUNCTION public.set_transaction_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_transaction_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_transaction_pin(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_transaction_pin(text) TO service_role;
