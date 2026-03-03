-- ====================================================================
-- UteelPay — Full Notification System Migration
-- 2026-03-03
-- ====================================================================

-- ── 1. NOTIFICATIONS TABLE (the inbox for each user) ─────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- NULL user_id = broadcast to all users (handled on client side)
  title           text NOT NULL,
  body            text NOT NULL,
  type            text NOT NULL DEFAULT 'general',
  -- 'general' | 'transaction' | 'wallet' | 'kyc' | 'security' |
  -- 'referral' | 'promo' | 'system' | 'reconciliation'
  channel         text[] NOT NULL DEFAULT '{in_app}',
  -- Array: 'in_app' | 'email' | 'sms' | 'push'
  is_read         boolean NOT NULL DEFAULT false,
  read_at         timestamp with time zone,
  action_url      text,                  -- deep link or CTA URL
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx   ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx       ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can mark their own as read
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only service role inserts (via Edge Functions / triggers)
CREATE POLICY "Service role insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (false);   -- blocked for regular users; service role bypasses RLS

-- ── 2. NOTIFICATION LOGS TABLE (delivery tracking) ────────────────────
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id                  uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id     uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  broadcast_id        uuid,              -- links to scheduled_notifications if batch
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel             text NOT NULL,     -- 'in_app' | 'email' | 'sms' | 'push'
  status              text NOT NULL DEFAULT 'pending',
  -- 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  provider            text,              -- 'resend' | 'termii' | 'firebase' | 'internal'
  provider_message_id text,
  error_message       text,
  opened_at           timestamp with time zone,
  clicked_at          timestamp with time zone,
  retry_count         integer NOT NULL DEFAULT 0,
  next_retry_at       timestamp with time zone,
  sent_at             timestamp with time zone DEFAULT now(),
  created_at          timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notif_logs_notification_id_idx ON public.notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS notif_logs_status_idx          ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS notif_logs_user_id_idx         ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS notif_logs_broadcast_id_idx    ON public.notification_logs(broadcast_id);
CREATE INDEX IF NOT EXISTS notif_logs_created_at_idx      ON public.notification_logs(created_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Admin only (service role) — no user access
CREATE POLICY "Block user access to notification_logs"
  ON public.notification_logs
  USING (false)
  WITH CHECK (false);

-- ── 3. SCHEDULED NOTIFICATIONS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  body            text NOT NULL,
  type            text NOT NULL DEFAULT 'general',
  audience        text NOT NULL DEFAULT 'all',
  -- 'all' | 'verified' | 'high_spenders' | 'inactive' | 'kyc_level_1'
  -- | 'kyc_level_2' | 'custom_ids'
  custom_user_ids uuid[],               -- populated when audience = 'custom_ids'
  channel         text[] NOT NULL DEFAULT '{in_app}',
  action_url      text,
  metadata        jsonb DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'scheduled',
  -- 'scheduled' | 'processing' | 'sent' | 'cancelled' | 'failed'
  scheduled_at    timestamp with time zone NOT NULL,
  sent_at         timestamp with time zone,
  recipient_count integer DEFAULT 0,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sched_notif_status_idx       ON public.scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS sched_notif_scheduled_at_idx ON public.scheduled_notifications(scheduled_at);

CREATE TRIGGER update_scheduled_notifications_updated_at
  BEFORE UPDATE ON public.scheduled_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Admin only
CREATE POLICY "Block user access to scheduled_notifications"
  ON public.scheduled_notifications
  USING (false)
  WITH CHECK (false);

-- ── 4. NOTIFICATION TEMPLATES TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text NOT NULL UNIQUE,      -- 'transaction_failed', 'kyc_approved', etc.
  title       text NOT NULL,
  body        text NOT NULL,             -- supports {{variable}} placeholders
  type        text NOT NULL DEFAULT 'general',
  channels    text[] NOT NULL DEFAULT '{in_app}',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block user access to notification_templates"
  ON public.notification_templates
  USING (false)
  WITH CHECK (false);

-- ── 5. SEED DEFAULT SMART TRIGGER TEMPLATES ───────────────────────────
INSERT INTO public.notification_templates (slug, title, body, type, channels) VALUES
  ('transaction_failed',       '⚠️ Transaction Failed',         'Your {{service}} transaction of ₦{{amount}} failed. Please try again or contact support.', 'transaction', '{in_app,email}'),
  ('wallet_funded',            '💰 Wallet Funded',               'Your UteelPay wallet has been credited with ₦{{amount}}. New balance: ₦{{balance}}.', 'wallet', '{in_app,email}'),
  ('kyc_approved',             '✅ KYC Approved',                'Congratulations! Your identity has been verified. You now have access to all UteelPay features.', 'kyc', '{in_app,email}'),
  ('kyc_rejected',             '❌ KYC Rejected',                'Your KYC verification was rejected. Reason: {{reason}}. Please re-submit with correct documents.', 'kyc', '{in_app,email}'),
  ('suspicious_login',         '🔒 Suspicious Login Detected',   'We detected a login attempt from {{ip}} at {{time}}. If this was not you, please secure your account immediately.', 'security', '{in_app,email,sms}'),
  ('reconciliation_mismatch',  '🚨 Reconciliation Alert',        'A financial mismatch has been detected. Case ID: {{case_id}}. Immediate review required.', 'reconciliation', '{email}'),
  ('referral_commission',      '🎉 Commission Earned!',          'You earned a referral commission of ₦{{amount}} for referring {{referee_name}}.', 'referral', '{in_app,email}'),
  ('maintenance_alert',        '🔧 Scheduled Maintenance',       'UteelPay will be undergoing maintenance on {{date}} from {{start_time}} to {{end_time}}.', 'system', '{in_app,email,push}'),
  ('promo_campaign',           '🎁 Exclusive Offer',             '{{promo_title}}: {{promo_body}} Valid until {{expiry}}.', 'promo', '{in_app,email,push}'),
  ('expiry_reminder',          '⏰ Service Expiry Reminder',     'Your {{service}} subscription is expiring on {{expiry_date}}. Renew now to avoid interruption.', 'system', '{in_app,push}')
ON CONFLICT (slug) DO NOTHING;

-- ── 6. HELPER FUNCTION: Resolve Audience to User IDs ─────────────────
CREATE OR REPLACE FUNCTION public.resolve_notification_audience(
  p_audience text,
  p_custom_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_audience = 'all' THEN
    RETURN QUERY SELECT p.id FROM public.profiles p
      WHERE p.deactivated_at IS NULL;

  ELSIF p_audience = 'verified' THEN
    -- Users with at least one successful transaction (proxy for "active/verified")
    RETURN QUERY SELECT DISTINCT t.user_id FROM public.transactions t
      WHERE t.status = 'success';

  ELSIF p_audience = 'high_spenders' THEN
    -- Users with total spend > ₦10,000
    RETURN QUERY
      SELECT t.user_id FROM public.transactions t
      WHERE t.status = 'success' AND t.type != 'wallet_fund' AND t.amount < 0
      GROUP BY t.user_id
      HAVING SUM(ABS(t.amount)) > 10000;

  ELSIF p_audience = 'inactive' THEN
    -- No transaction in last 30 days
    RETURN QUERY
      SELECT p.id FROM public.profiles p
      WHERE p.deactivated_at IS NULL
        AND p.id NOT IN (
          SELECT DISTINCT t2.user_id FROM public.transactions t2
          WHERE t2.created_at > NOW() - INTERVAL '30 days'
        );

  ELSIF p_audience = 'kyc_level_1' THEN
    -- Placeholder — adjust when you have a KYC level column
    RETURN QUERY SELECT p.id FROM public.profiles p WHERE p.deactivated_at IS NULL LIMIT 100;

  ELSIF p_audience = 'custom_ids' AND p_custom_ids IS NOT NULL THEN
    RETURN QUERY SELECT UNNEST(p_custom_ids) AS user_id;

  ELSE
    -- default: all active users
    RETURN QUERY SELECT p.id FROM public.profiles p WHERE p.deactivated_at IS NULL;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_notification_audience(text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_notification_audience(text, uuid[]) TO service_role;

-- ── 7. HELPER VIEW: Notification Stats ───────────────────────────────
CREATE OR REPLACE VIEW public.v_notification_stats AS
SELECT
  COUNT(*)                                              AS total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered')          AS delivered,
  COUNT(*) FILTER (WHERE status = 'failed')             AS failed,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL)         AS opened,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)        AS clicked,
  COUNT(*) FILTER (WHERE status = 'pending')            AS pending,
  ROUND(
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::numeric
    / NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0) * 100, 1
  )                                                     AS open_rate_pct,
  ROUND(
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric
    / NULLIF(COUNT(*) FILTER (WHERE opened_at IS NOT NULL), 0) * 100, 1
  )                                                     AS click_rate_pct
FROM public.notification_logs;
