// @ts-nocheck
// deno-lint-ignore-file
/// <reference lib="deno.ns" />
/**
 * UteelPay — Reconciliation Cron Edge Function
 *
 * Triggered nightly at 23:55 WAT via Supabase cron (pg_cron)
 * or called manually from the Admin Portal.
 *
 * What it does:
 *  1. Runs SQL reconciliation on the given date
 *  2. Detects mismatches, duplicates, profit variance
 *  3. Sends an HTML email report to Super Admin
 *  4. Logs the cron run to audit_logs
 *  5. Alerts if failure rate > threshold or profit margin drops
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

// ─── Config Thresholds ────────────────────────────────────────────────────────
const FAILURE_RATE_THRESHOLD = 15;    // alert if failure rate > 15%
const PROFIT_DROP_THRESHOLD = 50;    // alert if profit variance > ₦50
const SUPER_ADMIN_EMAIL = Deno.env.get("SUPER_ADMIN_EMAIL") ?? "support@uteelpay.com";

// ─── Email HTML Template ──────────────────────────────────────────────────────
function buildEmailHTML(report: Record<string, unknown>, alerts: string[]): string {
    const alertHtml = alerts.length
        ? `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
        <strong style="color:#92400E;">⚠️ Alerts</strong><br/>
        <ul style="margin:8px 0 0;padding-left:20px;color:#78350F;">${alerts.map((a) => `<li>${a}</li>`).join("")}</ul>
      </div>`
        : "";

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#F8FAFC;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#7C3AED,#5B21B6);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">UteelPay Reconciliation Report</h1>
      <p style="color:#DDD6FE;margin:4px 0 0;font-size:13px;">
        Date: ${report.report_date} · Generated: ${new Date().toISOString()}
      </p>
    </div>
    <div style="padding:24px 32px;">
      ${alertHtml}
      <h2 style="font-size:16px;color:#1E1B4B;margin-bottom:16px;">Financial Summary</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#F5F3FF;">
          <td style="padding:10px 14px;font-weight:600;color:#4C1D95;">Total Deposits</td>
          <td style="padding:10px 14px;text-align:right;font-weight:700;color:#059669;">₦${Number(report.total_deposits ?? 0).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#374151;">Service Cost</td>
          <td style="padding:10px 14px;text-align:right;color:#374151;">₦${Number(report.total_service ?? 0).toLocaleString()}</td>
        </tr>
        <tr style="background:#F5F3FF;">
          <td style="padding:10px 14px;font-weight:600;color:#4C1D95;">Expected Profit</td>
          <td style="padding:10px 14px;text-align:right;font-weight:700;color:#059669;">₦${Number(report.expected_profit ?? 0).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#374151;">Actual Profit</td>
          <td style="padding:10px 14px;text-align:right;color:#374151;">₦${Number(report.actual_profit ?? 0).toLocaleString()}</td>
        </tr>
        <tr style="background:#FEF2F2;">
          <td style="padding:10px 14px;font-weight:600;color:#991B1B;">Profit Variance</td>
          <td style="padding:10px 14px;text-align:right;font-weight:700;color:#DC2626;">
            ₦${(Number(report.expected_profit ?? 0) - Number(report.actual_profit ?? 0)).toLocaleString()}
          </td>
        </tr>
      </table>

      <h2 style="font-size:16px;color:#1E1B4B;margin:24px 0 16px;">Transaction Summary</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#F5F3FF;">
          <td style="padding:10px 14px;color:#374151;">Total Transactions</td>
          <td style="padding:10px 14px;text-align:right;font-weight:700;">${report.total_txns ?? 0}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#374151;">Successful</td>
          <td style="padding:10px 14px;text-align:right;color:#059669;font-weight:700;">${report.success_txns ?? 0}</td>
        </tr>
        <tr style="background:#F5F3FF;">
          <td style="padding:10px 14px;color:#374151;">Failed</td>
          <td style="padding:10px 14px;text-align:right;color:#DC2626;font-weight:700;">${report.failed_txns ?? 0}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#374151;">Duplicates Detected</td>
          <td style="padding:10px 14px;text-align:right;color:${Number(report.duplicates) > 0 ? "#DC2626" : "#059669"};font-weight:700;">
            ${report.duplicates ?? 0}
          </td>
        </tr>
        <tr style="background:#F5F3FF;">
          <td style="padding:10px 14px;color:#374151;">Total Mismatches</td>
          <td style="padding:10px 14px;text-align:right;color:${Number(report.mismatches) > 0 ? "#D97706" : "#059669"};font-weight:700;">
            ${report.mismatches ?? 0}
          </td>
        </tr>
      </table>

      <div style="margin-top:24px;padding:16px;background:#EFF6FF;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#1E40AF;font-size:13px;">
          Review full reconciliation details in the 
          <a href="https://app.uteelpay.com/admin/reconciliation" style="color:#7C3AED;font-weight:600;">Admin Portal →</a>
        </p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">
        This is an automated report from UteelPay Finance System. Do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send Email via SMTP/Resend ───────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
        console.warn("[reconciliation-cron] RESEND_API_KEY not set, skipping email");
        return false;
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "UteelPay Finance <noreply@uteelpay.com>",
                to: [to],
                subject,
                html,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[reconciliation-cron] Email send failed:", err);
            return false;
        }

        console.log("[reconciliation-cron] Email sent to", to);
        return true;
    } catch (e) {
        console.error("[reconciliation-cron] Email error:", e);
        return false;
    }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role for full DB access
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Parse optional date param; default to today
    let targetDate: string;
    try {
        const body = req.method === "POST" ? await req.json() : {};
        targetDate = body.date ?? new Date().toISOString().slice(0, 10);
    } catch {
        targetDate = new Date().toISOString().slice(0, 10);
    }

    console.log(`[reconciliation-cron] Running reconciliation for ${targetDate}`);

    try {
        // ── 1. Run DB reconciliation function ────────────────────────────────────
        const { data: reportData, error: rpcError } = await db.rpc(
            "run_reconciliation",
            { p_date: targetDate }
        );

        if (rpcError) {
            console.error("[reconciliation-cron] RPC error:", rpcError);
            return json({ success: false, error: rpcError.message }, 500);
        }

        const report = reportData as Record<string, unknown>;

        // ── 2. Build alerts ───────────────────────────────────────────────────────
        const alerts: string[] = [];
        const failureRate = report.total_txns
            ? (Number(report.failed_txns) / Number(report.total_txns)) * 100
            : 0;

        if (failureRate > FAILURE_RATE_THRESHOLD) {
            alerts.push(`Transaction failure rate is ${failureRate.toFixed(1)}% (threshold: ${FAILURE_RATE_THRESHOLD}%)`);
        }

        const profitVariance = Number(report.expected_profit ?? 0) - Number(report.actual_profit ?? 0);
        if (Math.abs(profitVariance) > PROFIT_DROP_THRESHOLD) {
            alerts.push(`Profit variance of ₦${profitVariance.toLocaleString()} detected. Expected: ₦${Number(report.expected_profit).toLocaleString()} | Actual: ₦${Number(report.actual_profit).toLocaleString()}`);
        }

        if (Number(report.duplicates ?? 0) > 0) {
            alerts.push(`${report.duplicates} duplicate transaction reference(s) detected.`);
        }

        if (Number(report.mismatches ?? 0) > 0) {
            alerts.push(`${report.mismatches} reconciliation case(s) opened. Review in the admin portal.`);
        }

        // ── 3. Send email report ──────────────────────────────────────────────────
        const subject = alerts.length > 0
            ? `🚨 [UteelPay] Reconciliation Alerts — ${targetDate}`
            : `✅ [UteelPay] Daily Reconciliation Report — ${targetDate}`;

        const html = buildEmailHTML(report, alerts);
        const emailSent = await sendEmail(SUPER_ADMIN_EMAIL, subject, html);

        // ── 4. Mark email_sent in reports ─────────────────────────────────────────
        if (emailSent) {
            await db
                .from("reconciliation_reports")
                .update({ email_sent: true } as any)
                .eq("report_date", targetDate);
        }

        // ── 5. Log cron run to audit_logs ─────────────────────────────────────────
        await db.from("audit_logs" as any).insert({
            admin_email: "system@uteelpay.com",
            action: `Nightly reconciliation completed for ${targetDate}`,
            target_type: "reconciliation",
            target_id: report.report_id,
            metadata: {
                report,
                alerts,
                email_sent: emailSent,
            },
        });

        console.log("[reconciliation-cron] Complete", { targetDate, alerts: alerts.length, emailSent });

        return json({
            success: true,
            date: targetDate,
            report,
            alerts,
            email_sent: emailSent,
        });

    } catch (err) {
        console.error("[reconciliation-cron] Fatal error:", err);
        return json({ success: false, error: (err as Error).message }, 500);
    }
});
