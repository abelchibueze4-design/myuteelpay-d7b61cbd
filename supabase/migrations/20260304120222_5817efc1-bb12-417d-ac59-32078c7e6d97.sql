
-- Admin can view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.wallets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin can view all referral codes
CREATE POLICY "Admins can view all referral codes"
ON public.referral_codes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin can view all referred users
CREATE POLICY "Admins can view all referred users"
ON public.referred_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin can view all notification preferences
CREATE POLICY "Admins can view all notification preferences"
ON public.notification_preferences FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin can update all transactions (e.g. status changes)
CREATE POLICY "Admins can update all transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin can update all wallets
CREATE POLICY "Admins can update all wallets"
ON public.wallets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
