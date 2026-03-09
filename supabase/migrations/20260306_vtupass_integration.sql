-- VTU API Integration Schema
-- Creates tables for Networks, Data Plans, Cable TV, and Electricity Discos
-- Seeds initial data based on the provided requirements.

-- 1. Networks Table
CREATE TABLE IF NOT EXISTS public.networks (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL UNIQUE, -- MTN, GLO, etc.
  provider_id   integer NOT NULL, -- KVData ID (1, 2, 3, 4)
  is_active     boolean DEFAULT true,
  created_at    timestamp with time zone DEFAULT now()
);

-- 2. Data Plans Table
CREATE TABLE IF NOT EXISTS public.data_plans (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id    uuid NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  plan_id       integer NOT NULL, -- KVData Plan ID (e.g., 245)
  name          text NOT NULL, -- "1.0 GB"
  price         numeric NOT NULL, -- 140
  type          text NOT NULL, -- SME, GIFTING, CORPORATE GIFTING
  validity      text, -- "MONTHLY", "1 DAY"
  data_amount   text, -- "1.0 GB"
  is_active     boolean DEFAULT true,
  created_at    timestamp with time zone DEFAULT now(),
  UNIQUE(network_id, plan_id)
);

-- 3. Cable Providers Table
CREATE TABLE IF NOT EXISTS public.cable_providers (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL UNIQUE, -- DSTV, GOTV, STARTIMES
  provider_id   integer NOT NULL, -- KVData ID
  is_active     boolean DEFAULT true,
  created_at    timestamp with time zone DEFAULT now()
);

-- 4. Cable Plans Table
CREATE TABLE IF NOT EXISTS public.cable_plans (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id   uuid NOT NULL REFERENCES public.cable_providers(id) ON DELETE CASCADE,
  plan_id       integer NOT NULL, -- KVData Plan ID
  name          text NOT NULL, -- "GoTV Supa Plus"
  price         numeric NOT NULL, -- 16800
  is_active     boolean DEFAULT true,
  created_at    timestamp with time zone DEFAULT now(),
  UNIQUE(provider_id, plan_id)
);

-- 5. Electricity Discos Table
CREATE TABLE IF NOT EXISTS public.electricity_discos (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL UNIQUE, -- Ikeja Electric
  provider_id   integer NOT NULL, -- KVData ID
  is_active     boolean DEFAULT true,
  created_at    timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cable_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cable_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_discos ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Read for all authenticated, Write for Admins)
CREATE POLICY "Public read access for networks" ON public.networks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access for data_plans" ON public.data_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access for cable_providers" ON public.cable_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access for cable_plans" ON public.cable_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access for electricity_discos" ON public.electricity_discos FOR SELECT TO authenticated USING (true);

-- Admin Write Policies (Assuming admin role check exists or can be added later)
-- For now, we'll allow service_role to manage these, which is default.
-- Users should NOT be able to insert/update these tables.

-- SEED DATA ---------------------------------------------------------

-- 1. Networks
INSERT INTO public.networks (name, provider_id) VALUES
('MTN', 1),
('GLO', 2),
('9MOBILE', 3),
('AIRTEL', 4),
('SMILE', 5)
ON CONFLICT (name) DO NOTHING;

-- 2. Data Plans (Seed a subset for demonstration, admin can add more via API/Dashboard)
-- Note: In a real scenario, we'd script this heavily. Here we add the provided list.

DO $$
DECLARE
  v_mtn_id uuid;
  v_glo_id uuid;
  v_9mobile_id uuid;
  v_airtel_id uuid;
  v_smile_id uuid;
BEGIN
  SELECT id INTO v_mtn_id FROM public.networks WHERE name = 'MTN';
  SELECT id INTO v_glo_id FROM public.networks WHERE name = 'GLO';
  SELECT id INTO v_9mobile_id FROM public.networks WHERE name = '9MOBILE';
  SELECT id INTO v_airtel_id FROM public.networks WHERE name = 'AIRTEL';

  -- 9MOBILE Plans
  INSERT INTO public.data_plans (network_id, plan_id, type, price, data_amount, validity, name) VALUES
  (v_9mobile_id, 245, 'CORPORATE GIFTING', 140, '1.0 GB', 'MONTHLY', '1.0 GB Corporate Gifting'),
  (v_9mobile_id, 246, 'CORPORATE GIFTING', 280, '2.0 GB', 'MONTHLY', '2.0 GB Corporate Gifting'),
  (v_9mobile_id, 277, 'CORPORATE GIFTING', 420, '3.0 GB', 'MONTHLY', '3.0 GB Corporate Gifting'),
  (v_9mobile_id, 313, 'CORPORATE GIFTING', 85, '500.0 MB', 'MONTHLY', '500 MB Corporate Gifting'),
  (v_9mobile_id, 321, 'CORPORATE GIFTING', 700, '5.0 GB', 'MONTHLY', '5.0 GB Corporate Gifting'),
  (v_9mobile_id, 432, 'CORPORATE GIFTING', 3100, '10.0 GB', 'Monthly', '10.0 GB Corporate Gifting')
  ON CONFLICT (network_id, plan_id) DO NOTHING;

  -- AIRTEL Plans
  INSERT INTO public.data_plans (network_id, plan_id, type, price, data_amount, validity, name) VALUES
  (v_airtel_id, 391, 'SME', 380, '1.0 GB', '2 DAYS', '1.0 GB SME'),
  (v_airtel_id, 392, 'SME', 700, '2.0 GB', '2 DAYS', '2.0 GB SME'),
  (v_airtel_id, 441, 'SME', 2050, '3.0 GB', '30 DAYS', '3.0 GB SME'),
  (v_airtel_id, 415, 'GIFTING', 300, '1.0 GB', '1 DAY', '1.0 GB Gifting'),
  (v_airtel_id, 421, 'GIFTING', 1425, '2.0 GB', 'Monthly', '2.0 GB Gifting'),
  (v_airtel_id, 422, 'GIFTING', 1530, '5.0 GB', 'WEEKLY', '5.0 GB Gifting')
  ON CONFLICT (network_id, plan_id) DO NOTHING;

  -- GLO Plans
  INSERT INTO public.data_plans (network_id, plan_id, type, price, data_amount, validity, name) VALUES
  (v_glo_id, 257, 'CORPORATE GIFTING', 198, '500.0 MB', 'MONTHLY', '500 MB Corporate Gifting'),
  (v_glo_id, 258, 'CORPORATE GIFTING', 395, '1.0 GB', 'MONTHLY', '1.0 GB Corporate Gifting'),
  (v_glo_id, 259, 'CORPORATE GIFTING', 790, '2.0 GB', 'MONTHLY', '2.0 GB Corporate Gifting'),
  (v_glo_id, 357, 'SME', 195, '750.0 MB', 'DAILY', '750 MB SME'),
  (v_glo_id, 358, 'SME', 290, '1.5 GB', 'DAILY', '1.5 GB SME')
  ON CONFLICT (network_id, plan_id) DO NOTHING;

  -- MTN Plans
  INSERT INTO public.data_plans (network_id, plan_id, type, price, data_amount, validity, name) VALUES
  (v_mtn_id, 7, 'SME', 700, '1.0 GB', '30 days', '1.0 GB SME'),
  (v_mtn_id, 8, 'SME', 1400, '2.0 GB', '30 days', '2.0 GB SME'),
  (v_mtn_id, 44, 'SME', 2100, '3.0 GB', '30 days', '3.0 GB SME'),
  (v_mtn_id, 214, 'SME', 8000, '10.0 GB', '30 days', '10.0 GB SME'),
  (v_mtn_id, 442, 'DATA COUPONS', 530, '1.0 GB', 'Monthly', '1.0 GB Data Coupon'),
  (v_mtn_id, 443, 'DATA COUPONS', 900, '2.0 GB', 'Monthly', '2.0 GB Data Coupon')
  ON CONFLICT (network_id, plan_id) DO NOTHING;
END $$;

-- 3. Cable Providers
INSERT INTO public.cable_providers (name, provider_id) VALUES
('GOTV', 1),
('DSTV', 2),
('STARTIMES', 3)
ON CONFLICT (name) DO NOTHING;

-- 4. Cable Plans (Seed subset)
DO $$
DECLARE
  v_gotv_id uuid;
  v_dstv_id uuid;
  v_startimes_id uuid;
BEGIN
  SELECT id INTO v_gotv_id FROM public.cable_providers WHERE name = 'GOTV';
  SELECT id INTO v_dstv_id FROM public.cable_providers WHERE name = 'DSTV';
  SELECT id INTO v_startimes_id FROM public.cable_providers WHERE name = 'STARTIMES';

  -- GOtv Plans
  INSERT INTO public.cable_plans (provider_id, plan_id, name, price) VALUES
  (v_gotv_id, 47, 'GoTV Supa Plus', 16800),
  (v_gotv_id, 48, 'GOtv Supa', 11400),
  (v_gotv_id, 49, 'GOtv Max', 8500),
  (v_gotv_id, 50, 'GOtv Jolli', 5800),
  (v_gotv_id, 51, 'GOtv Jinja', 3900),
  (v_gotv_id, 52, 'GOtv Smallie', 1900)
  ON CONFLICT (provider_id, plan_id) DO NOTHING;

  -- DStv Plans
  INSERT INTO public.cable_plans (provider_id, plan_id, name, price) VALUES
  (v_dstv_id, 56, 'DStv Padi', 4400),
  (v_dstv_id, 57, 'DStv Yanga', 6000),
  (v_dstv_id, 58, 'DStv Confam', 11000),
  (v_dstv_id, 59, 'DStv Compact', 19000),
  (v_dstv_id, 63, 'DStv Confam + ExtraView', 17000)
  ON CONFLICT (provider_id, plan_id) DO NOTHING;
END $$;

-- 5. Electricity Discos
INSERT INTO public.electricity_discos (name, provider_id) VALUES
('Ikeja Electric', 1),
('Eko Electric', 2),
('Abuja Electric', 3),
('Kano Electric', 4),
('Enugu Electric', 5),
('Port Harcourt Electric', 6),
('Ibadan Electric', 7),
('Kaduna Electric', 8),
('Jos Electric', 9),
('Benin Electric', 10),
('Yola Electric', 11)
ON CONFLICT (name) DO NOTHING;
