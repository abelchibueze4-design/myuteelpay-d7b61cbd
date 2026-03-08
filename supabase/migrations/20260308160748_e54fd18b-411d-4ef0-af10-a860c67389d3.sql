
CREATE TABLE public.api_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  response_time_ms integer,
  error_message text,
  checked_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.api_health_checks ENABLE ROW LEVEL SECURITY;

-- Admins can read
CREATE POLICY "Admins can view health checks" ON public.api_health_checks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Block regular users
CREATE POLICY "Block user access to health checks" ON public.api_health_checks
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- Create index for quick lookups
CREATE INDEX idx_health_checks_provider_time ON public.api_health_checks (provider, checked_at DESC);
