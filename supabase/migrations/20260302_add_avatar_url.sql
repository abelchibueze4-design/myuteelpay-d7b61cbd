-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Add address column if not exists
ALTER TABLE public.profiles ADD COLUMN address TEXT;
