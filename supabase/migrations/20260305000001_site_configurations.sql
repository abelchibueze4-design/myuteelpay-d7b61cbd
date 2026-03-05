-- ── SITE CONFIGURATIONS SYSTEM ────────────────────────────────
-- This migration creates a table to store deployment and platform-specific
-- configurations that were previously stored in static .json files.

-- 1. Create site_configurations table
CREATE TABLE IF NOT EXISTS public.site_configurations (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform      text NOT NULL UNIQUE, -- 'vercel', 'netlify', 'truehost', 'general'
  config_data   jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active     boolean DEFAULT true,
  last_updated  timestamp with time zone DEFAULT now(),
  created_at    timestamp with time zone DEFAULT now()
);

-- 2. Insert initial data from the .json files
-- Vercel Config
INSERT INTO public.site_configurations (platform, config_data)
VALUES (
  'vercel',
  '{
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }'::jsonb
) ON CONFLICT (platform) DO UPDATE SET config_data = EXCLUDED.config_data;

-- Netlify Config
INSERT INTO public.site_configurations (platform, config_data)
VALUES (
  'netlify',
  '{
    "redirects": [
      {
        "from": "/*",
        "to": "/index.html",
        "status": 200
      }
    ]
  }'::jsonb
) ON CONFLICT (platform) DO UPDATE SET config_data = EXCLUDED.config_data;

-- Truehost Config
INSERT INTO public.site_configurations (platform, config_data)
VALUES (
  'truehost',
  '{
    "name": "myuteelpay",
    "version": "1.0.0",
    "dist": "dist",
    "framework": "vite",
    "routing": "index.html"
  }'::jsonb
) ON CONFLICT (platform) DO UPDATE SET config_data = EXCLUDED.config_data;

-- 3. Enable RLS
ALTER TABLE public.site_configurations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Only admins can view or modify configurations
CREATE POLICY "Admins can manage site configurations"
  ON public.site_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow system processes (service role) full access
-- (Supabase automatically handles service_role bypass for RLS if configured, 
-- but explicit policies are safer for some setups)

-- 5. Helper function to update the last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_site_config_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_site_config_timestamp
  BEFORE UPDATE ON public.site_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_site_config_timestamp();
