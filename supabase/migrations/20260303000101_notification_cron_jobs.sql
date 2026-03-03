-- ====================================================================
-- UteelPay — Notification Cron Jobs
-- Runs scheduled_notifications processor every 5 minutes
-- Runs retry_failed every 15 minutes
-- ====================================================================
-- Prerequisites: pg_cron and pg_net extensions enabled (see reconciliation cron migration)

-- ── 1. Process scheduled notifications every 5 minutes ──────────────
SELECT cron.schedule(
  'uteelpay-process-scheduled-notifications',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notification-engine',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{"action":"process_scheduled"}'
    );
  $$
);

-- ── 2. Retry failed deliveries every 15 minutes ──────────────────────
SELECT cron.schedule(
  'uteelpay-retry-failed-notifications',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notification-engine',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{"action":"retry_failed"}'
    );
  $$
);

-- ── To view all scheduled jobs ────────────────────────────────────────
-- SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
--
-- ── To pause a job ────────────────────────────────────────────────────
-- UPDATE cron.job SET active = false WHERE jobname = 'uteelpay-process-scheduled-notifications';
