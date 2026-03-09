CREATE POLICY "Anyone can read site_configurations"
ON public.site_configurations
FOR SELECT
USING (true);