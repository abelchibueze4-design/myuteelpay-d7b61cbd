
CREATE TABLE IF NOT EXISTS public.cables (
  cable_id INTEGER PRIMARY KEY,
  cable_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cable_plans (
  cableplan_id INTEGER PRIMARY KEY,
  cable_id INTEGER REFERENCES public.cables(cable_id),
  cableplan_name TEXT NOT NULL,
  cableplan_amount INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.electricity_companies (
  disco_id INTEGER PRIMARY KEY,
  disco_name TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.cables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cable_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_companies ENABLE ROW LEVEL SECURITY;

-- Public read access (these are reference data)
CREATE POLICY "Anyone can read cables" ON public.cables FOR SELECT USING (true);
CREATE POLICY "Anyone can read cable_plans" ON public.cable_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can read electricity_companies" ON public.electricity_companies FOR SELECT USING (true);

-- Also add public read to existing reference tables
CREATE POLICY "Anyone can read networks" ON public.networks FOR SELECT USING (true);
CREATE POLICY "Anyone can read data_plans" ON public.data_plans FOR SELECT USING (true);
