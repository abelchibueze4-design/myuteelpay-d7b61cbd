-- ============================================================
-- UteelPay — Nightly Reconciliation Cron Job
-- Uses pg_cron (enabled via Supabase dashboard)
-- 
-- To enable:
--   1. Enable pg_cron extension in Supabase dashboard → Database → Extensions
--   2. Run this migration
-- ============================================================

-- Enable pg_cron extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- ── Schedule: run_reconciliation every night at 23:55 WAT (22:55 UTC) ──
SELECT cron.schedule(
  'uteelpay-nightly-reconciliation',    -- unique job name
  '55 22 * * *',                         -- cron expression: 22:55 UTC = 23:55 WAT
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/reconciliation-cron',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'date', TO_CHAR(NOW() AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD')
      )::text
    );
  $$
);

-- ── Alternative: If net.http_post is not available (pg_net not installed),
-- ── call the SQL function directly and let the Edge Function email be
-- ── triggered manually. The SQL function can still run:
-- 
-- SELECT cron.schedule(
--   'uteelpay-nightly-reconciliation-sql',
--   '55 22 * * *',
--   $$ SELECT public.run_reconciliation(CURRENT_DATE); $$
-- );

-- ── To view scheduled jobs:
-- SELECT * FROM cron.job;
--
-- ── To unschedule:
-- SELECT cron.unschedule('uteelpay-nightly-reconciliation');
