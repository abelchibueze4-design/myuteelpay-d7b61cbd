
CREATE TABLE public.virtual_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  provider text NOT NULL,
  gateway text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_number, provider)
);

ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual accounts"
  ON public.virtual_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage virtual accounts"
  ON public.virtual_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
