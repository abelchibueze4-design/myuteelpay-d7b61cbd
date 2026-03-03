-- ============================================================
-- UteelPay Reconciliation System Migration
-- 2026-03-03
-- ============================================================

-- ── 1. AUDIT LOGS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email   text,
  action        text NOT NULL,
  target_type   text,                         -- 'transaction' | 'user' | 'reconciliation' | 'system'
  target_id     text,
  metadata      jsonb DEFAULT '{}'::jsonb,
  ip_address    text,
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_admin_id_idx    ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_target_type_idx ON public.audit_logs(target_type);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins (service-role) can read/write audit logs from Edge Functions
-- Frontend reads via service role; regular users cannot access
CREATE POLICY "Admin service role full access on audit_logs"
  ON public.audit_logs
  USING (false)   -- block all direct RLS access; use service role via Edge Function
  WITH CHECK (false);

-- ── 2. RECONCILIATION CASES TABLE ─────────────────────────
CREATE TABLE IF NOT EXISTS public.reconciliation_cases (
  id                  uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id      uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  reference           text,
  issue_type          text NOT NULL,
  -- 'payment_not_delivered' | 'service_undeducted' | 'duplicate' |
  -- 'missing_webhook' | 'profit_mismatch' | 'wallet_mismatch'
  description         text NOT NULL,
  expected_amount     numeric(14,2),
  actual_amount       numeric(14,2),
  variance            numeric(14,2) GENERATED ALWAYS AS (
                        COALESCE(expected_amount, 0) - COALESCE(actual_amount, 0)
                      ) STORED,
  status              text NOT NULL DEFAULT 'open',
  -- 'open' | 'resolved' | 'escalated' | 'fraud' | 'false_positive'
  admin_notes         text,
  resolved_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at         timestamp with time zone,
  severity            text NOT NULL DEFAULT 'medium',
  -- 'low' | 'medium' | 'high' | 'critical'
  metadata            jsonb DEFAULT '{}'::jsonb,
  created_at          timestamp with time zone NOT NULL DEFAULT now(),
  updated_at          timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recon_cases_status_idx      ON public.reconciliation_cases(status);
CREATE INDEX IF NOT EXISTS recon_cases_issue_type_idx  ON public.reconciliation_cases(issue_type);
CREATE INDEX IF NOT EXISTS recon_cases_created_at_idx  ON public.reconciliation_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS recon_cases_txn_id_idx      ON public.reconciliation_cases(transaction_id);

-- Trigger: updated_at
CREATE TRIGGER update_reconciliation_cases_updated_at
  BEFORE UPDATE ON public.reconciliation_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reconciliation_cases ENABLE ROW LEVEL SECURITY;

-- Admins (via service role in edge functions) have full access
-- Block regular user access entirely
CREATE POLICY "Block user access to reconciliation_cases"
  ON public.reconciliation_cases
  USING (false)
  WITH CHECK (false);

-- ── 3. RECONCILIATION REPORTS TABLE ───────────────────────
CREATE TABLE IF NOT EXISTS public.reconciliation_reports (
  id                  uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date         date NOT NULL UNIQUE,
  total_deposits      numeric(14,2) DEFAULT 0,
  total_withdrawals   numeric(14,2) DEFAULT 0,
  total_service_cost  numeric(14,2) DEFAULT 0,
  expected_profit     numeric(14,2) DEFAULT 0,
  actual_profit       numeric(14,2) DEFAULT 0,
  profit_variance     numeric(14,2) GENERATED ALWAYS AS (
                        COALESCE(expected_profit, 0) - COALESCE(actual_profit, 0)
                      ) STORED,
  total_transactions  integer DEFAULT 0,
  successful_txns     integer DEFAULT 0,
  failed_txns         integer DEFAULT 0,
  duplicate_count     integer DEFAULT 0,
  missing_webhook_count integer DEFAULT 0,
  mismatch_count      integer DEFAULT 0,
  failure_rate        numeric(5,2) GENERATED ALWAYS AS (
                        CASE WHEN COALESCE(total_transactions, 0) = 0 THEN 0
                        ELSE ROUND((COALESCE(failed_txns, 0)::numeric / total_transactions * 100), 2)
                        END
                      ) STORED,
  email_sent          boolean DEFAULT false,
  generated_at        timestamp with time zone DEFAULT now(),
  generated_by        text DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS recon_reports_date_idx ON public.reconciliation_reports(report_date DESC);

ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block user access to reconciliation_reports"
  ON public.reconciliation_reports
  USING (false)
  WITH CHECK (false);

-- ── 4. WEBHOOK EVENTS TABLE ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider      text NOT NULL DEFAULT 'paystack',
  event_type    text NOT NULL,
  reference     text,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'received',
  -- 'received' | 'processed' | 'failed' | 'duplicate'
  processed_at  timestamp with time zone,
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_reference_type_idx
  ON public.webhook_events(provider, reference, event_type)
  WHERE reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS webhook_events_status_idx   ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS webhook_events_created_at_idx ON public.webhook_events(created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block user access to webhook_events"
  ON public.webhook_events
  USING (false)
  WITH CHECK (false);

-- ── 5. HELPER VIEW: Daily Transaction Summary ──────────────
CREATE OR REPLACE VIEW public.v_daily_transaction_summary AS
SELECT
  DATE(created_at)                                     AS txn_date,
  COUNT(*)                                             AS total_count,
  COUNT(*) FILTER (WHERE status = 'success')           AS success_count,
  COUNT(*) FILTER (WHERE status = 'failed')            AS failed_count,
  COUNT(*) FILTER (WHERE status = 'pending')           AS pending_count,
  SUM(amount) FILTER (WHERE type = 'wallet_fund' AND status = 'success')  AS total_deposits,
  SUM(ABS(amount)) FILTER (WHERE type != 'wallet_fund' AND status = 'success') AS total_service_spend,
  SUM(amount) FILTER (WHERE status = 'success')        AS net_movement,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'failed')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  )                                                    AS failure_rate_pct
FROM public.transactions
GROUP BY DATE(created_at)
ORDER BY txn_date DESC;

-- ── 6. HELPER FUNCTION: Run Reconciliation ────────────────
CREATE OR REPLACE FUNCTION public.run_reconciliation(p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id uuid;
  v_total_deposits numeric(14,2) := 0;
  v_total_service  numeric(14,2) := 0;
  v_expected_profit numeric(14,2) := 0;
  v_actual_profit  numeric(14,2) := 0;
  v_total_txns     integer := 0;
  v_success_txns   integer := 0;
  v_failed_txns    integer := 0;
  v_duplicates     integer := 0;
  v_mismatches     integer := 0;
  rec              record;
BEGIN
  -- ── Aggregate from transactions table for the given date ──
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'wallet_fund' AND status = 'success'), 0),
    COALESCE(SUM(ABS(amount)) FILTER (WHERE type != 'wallet_fund' AND status = 'success'), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'success'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO v_total_deposits, v_total_service, v_total_txns, v_success_txns, v_failed_txns
  FROM public.transactions
  WHERE DATE(created_at) = p_date;

  -- Expected profit = 3% platform fee on service transactions (configurable)
  v_expected_profit := ROUND(v_total_service * 0.03, 2);
  -- Actual profit approximation = deposits - service spend
  v_actual_profit   := ROUND(v_total_deposits - v_total_service, 2);

  -- ── Detect duplicates (same reference, same amount, same user within 1 min) ──
  SELECT COUNT(*) INTO v_duplicates
  FROM (
    SELECT reference, COUNT(*) AS cnt
    FROM public.transactions
    WHERE DATE(created_at) = p_date
      AND reference IS NOT NULL
    GROUP BY reference
    HAVING COUNT(*) > 1
  ) dup;

  -- ── Create reconciliation cases for duplicates ──
  FOR rec IN
    SELECT reference, array_agg(id) AS ids, COUNT(*) AS cnt
    FROM public.transactions
    WHERE DATE(created_at) = p_date AND reference IS NOT NULL
    GROUP BY reference
    HAVING COUNT(*) > 1
  LOOP
    INSERT INTO public.reconciliation_cases
      (reference, issue_type, description, severity, metadata)
    VALUES (
      rec.reference,
      'duplicate',
      format('Reference "%s" appears %s times. IDs: %s', rec.reference, rec.cnt, rec.ids::text),
      'high',
      jsonb_build_object('duplicate_ids', rec.ids, 'count', rec.cnt, 'date', p_date)
    )
    ON CONFLICT DO NOTHING;
    v_mismatches := v_mismatches + 1;
  END LOOP;

  -- ── Detect: wallet_fund success but no corresponding wallet credit ──
  FOR rec IN
    SELECT t.id, t.reference, t.amount, t.user_id, w.balance
    FROM public.transactions t
    LEFT JOIN public.wallets w ON w.id = t.user_id
    WHERE t.type = 'wallet_fund'
      AND t.status = 'success'
      AND DATE(t.created_at) = p_date
      AND w.balance = 0   -- suspicious: funded but wallet is zero
  LOOP
    INSERT INTO public.reconciliation_cases
      (transaction_id, reference, issue_type, description, expected_amount, actual_amount, severity, metadata)
    VALUES (
      rec.id,
      rec.reference,
      'payment_not_delivered',
      format('Wallet fund (₦%s) succeeded for user %s but wallet balance is 0.', rec.amount, rec.user_id),
      rec.amount,
      rec.balance,
      'critical',
      jsonb_build_object('user_id', rec.user_id, 'payment_amount', rec.amount, 'wallet_balance', rec.balance)
    )
    ON CONFLICT DO NOTHING;
    v_mismatches := v_mismatches + 1;
  END LOOP;

  -- ── Detect: service delivered (success) but amount is 0 or positive ──
  FOR rec IN
    SELECT t.id, t.reference, t.amount, t.type, t.user_id
    FROM public.transactions t
    WHERE t.type != 'wallet_fund'
      AND t.status = 'success'
      AND t.amount >= 0       -- service should deduct (negative amount)
      AND DATE(t.created_at) = p_date
  LOOP
    INSERT INTO public.reconciliation_cases
      (transaction_id, reference, issue_type, description, expected_amount, actual_amount, severity, metadata)
    VALUES (
      rec.id,
      rec.reference,
      'service_undeducted',
      format('Service "%s" marked success but wallet not deducted (amount=%s). User: %s', rec.type, rec.amount, rec.user_id),
      -rec.amount,
      rec.amount,
      'high',
      jsonb_build_object('service_type', rec.type, 'amount', rec.amount, 'user_id', rec.user_id)
    )
    ON CONFLICT DO NOTHING;
    v_mismatches := v_mismatches + 1;
  END LOOP;

  -- ── Upsert daily report ──
  INSERT INTO public.reconciliation_reports (
    report_date, total_deposits, total_withdrawals, total_service_cost,
    expected_profit, actual_profit, total_transactions,
    successful_txns, failed_txns, duplicate_count, mismatch_count
  ) VALUES (
    p_date, v_total_deposits, 0, v_total_service,
    v_expected_profit, v_actual_profit, v_total_txns,
    v_success_txns, v_failed_txns, v_duplicates, v_mismatches
  )
  ON CONFLICT (report_date) DO UPDATE SET
    total_deposits      = EXCLUDED.total_deposits,
    total_service_cost  = EXCLUDED.total_service_cost,
    expected_profit     = EXCLUDED.expected_profit,
    actual_profit       = EXCLUDED.actual_profit,
    total_transactions  = EXCLUDED.total_transactions,
    successful_txns     = EXCLUDED.successful_txns,
    failed_txns         = EXCLUDED.failed_txns,
    duplicate_count     = EXCLUDED.duplicate_count,
    mismatch_count      = EXCLUDED.mismatch_count,
    generated_at        = now()
  RETURNING id INTO v_report_id;

  RETURN jsonb_build_object(
    'report_date',      p_date,
    'report_id',        v_report_id,
    'total_deposits',   v_total_deposits,
    'total_service',    v_total_service,
    'expected_profit',  v_expected_profit,
    'actual_profit',    v_actual_profit,
    'total_txns',       v_total_txns,
    'success_txns',     v_success_txns,
    'failed_txns',      v_failed_txns,
    'duplicates',       v_duplicates,
    'mismatches',       v_mismatches
  );
END;
$$;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION public.run_reconciliation(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_reconciliation(date) TO service_role;
