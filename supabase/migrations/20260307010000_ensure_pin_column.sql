-- Ensure profiles table has transaction_pin_hash column
-- We use transaction_pin_hash to store the bcrypt hash of the PIN for security.
-- If the user strictly requires a column named 'transaction_pin', we can rename it,
-- but standard practice is to suffix with _hash. We will ensure the column exists.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'transaction_pin_hash') THEN
        ALTER TABLE public.profiles ADD COLUMN transaction_pin_hash TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'transaction_pin_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN transaction_pin_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure users can update their own profile
-- Drop existing policy if it exists to avoid conflicts (optional, but safer to create if not exists)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Ensure users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Grant permissions
GRANT UPDATE(transaction_pin_hash, transaction_pin_enabled) ON public.profiles TO authenticated;
