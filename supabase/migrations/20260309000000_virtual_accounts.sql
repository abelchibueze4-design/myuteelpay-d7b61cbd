-- Create virtual accounts table to store static accounts
CREATE TABLE IF NOT EXISTS public.user_virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, account_number)
);

ALTER TABLE public.user_virtual_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual accounts"
  ON public.user_virtual_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all virtual accounts"
  ON public.user_virtual_accounts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
