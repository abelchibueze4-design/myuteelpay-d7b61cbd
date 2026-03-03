// @ts-nocheck
// deno-lint-ignore-file
/// <reference lib="deno.ns" />
/**
 * UteelPay — Notification Engine Edge Function
 *
 * Handles:
 *  1. Broadcast — send to audience segment, all channels
 *  2. Smart trigger — fire specific template for a user event
 *  3. Scheduled processor — pick up due scheduled_notifications
 *  4. Mark open / click tracking (webhook from email provider)
 *  5. Retry failed deliveries
 *
 * Called from:
 *  - Admin Portal (broadcast + schedule)
 *  - Paystack webhook (wallet funded trigger)
 *  - Reconciliation cron (mismatch trigger)
 *  - Direct API (other triggers)
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

// ─── Email via Resend ──────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string, textBody?: string) {
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) { console.warn("[notif] RESEND_API_KEY not set"); return { ok: false, id: null }; }

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: "UteelPay <noreply@uteelpay.com>",
            to: [to],
            subject,
            html,
            text: textBody,
        }),
    });
    const data = await res.json();
    return { ok: res.ok, id: data.id ?? null, error: data.message };
}

// ─── SMS via Termii ────────────────────────────────────────────────────────
async function sendSMS(to: string, message: string) {
    const key = Deno.env.get("TERMII_API_KEY");
    if (!key) { console.warn("[notif] TERMII_API_KEY not set"); return { ok: false, id: null }; }

    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            to,
            from: "UteelPay",
            sms: message,
            type: "plain",
            api_key: key,
            channel: "generic",
        }),
    });
    const data = await res.json();
    return { ok: data.code === "ok", id: data.message_id ?? null, error: data.message };
}

// ─── Template variable interpolation ──────────────────────────────────────
function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ─── Build HTML email ──────────────────────────────────────────────────────
function buildEmailHTML(title: string, body: string, actionUrl?: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#F8FAFC;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#7C3AED,#5B21B6);padding:20px 28px;">
      <p style="color:#DDD6FE;margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;">UteelPay</p>
      <h1 style="color:#fff;margin:6px 0 0;font-size:20px;">${title}</h1>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">${body.replace(/\n/g, "<br/>")}</p>
      ${actionUrl ? `<div style="margin-top:20px;"><a href="${actionUrl}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;">Open App →</a></div>` : ""}
    </div>
    <div style="padding:14px 28px;background:#F8FAFC;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">You're receiving this because you have a UteelPay account. <a href="https://app.uteelpay.com/settings" style="color:#7C3AED;">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Insert notification + log helper ─────────────────────────────────────
async function insertNotification(
    db: ReturnType<typeof createClient>,
    {
        user_id,
        title,
        body,
        type,
        channels,
        action_url,
        metadata,
    }: {
        user_id: string | null;
        title: string;
        body: string;
        type: string;
        channels: string[];
        action_url?: string;
        metadata?: Record<string, unknown>;
    }
) {
    const { data: notif, error } = await db.from("notifications").insert({
        user_id,
        title,
        body,
        type,
        channel: channels,
        action_url,
        metadata: metadata ?? {},
    }).select("id").single();

    if (error) throw error;
    return notif.id as string;
}

// ─── Deliver to channels and log each ─────────────────────────────────────
async function deliverNotification(
    db: ReturnType<typeof createClient>,
    notifId: string,
    userId: string | null,
    userEmail: string | undefined,
    userPhone: string | undefined,
    title: string,
    body: string,
    channels: string[],
    actionUrl?: string,
    broadcastId?: string
) {
    const results: Record<string, unknown>[] = [];

    for (const channel of channels) {
        let status = "sent";
        let providerId: string | null = null;
        let errorMsg: string | null = null;
        let provider = "internal";

        if (channel === "in_app") {
            // in-app is stored in notifications table — already done
            status = "delivered";
            provider = "internal";
        } else if (channel === "email" && userEmail) {
            provider = "resend";
            const html = buildEmailHTML(title, body, actionUrl);
            const result = await sendEmail(userEmail, title, html, body);
            status = result.ok ? "sent" : "failed";
            providerId = result.id;
            errorMsg = result.error ?? null;
        } else if (channel === "sms" && userPhone) {
            provider = "termii";
            const result = await sendSMS(userPhone, `${title}\n${body}`);
            status = result.ok ? "sent" : "failed";
            providerId = result.id;
            errorMsg = result.error ?? null;
        } else if (channel === "push") {
            // Firebase Push — placeholder (add FCM integration here)
            provider = "firebase";
            status = "pending";
        } else {
            // Channel not available for this user (no email/phone)
            status = "failed";
            errorMsg = `No ${channel} address available`;
        }

        const { data: log } = await db.from("notification_logs").insert({
            notification_id: notifId,
            broadcast_id: broadcastId ?? null,
            user_id: userId,
            channel,
            status,
            provider,
            provider_message_id: providerId,
            error_message: errorMsg,
            sent_at: new Date().toISOString(),
        }).select("id").single();

        results.push({ channel, status, log_id: log?.id });
    }

    return results;
}

// ─── Main Handler ──────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }

    const action = (body.action as string) ?? "";

    // ══════════════════════════════════════════════════════════════════════
    // ACTION: broadcast — send to an audience segment
    // Body: { action: 'broadcast', title, body, type, audience, channels,
    //         action_url, metadata, vars, broadcast_id }
    // ══════════════════════════════════════════════════════════════════════
    if (action === "broadcast") {
        const {
            title, body: msgBody, type = "general",
            audience = "all", channels = ["in_app"],
            action_url, metadata, vars = {}, broadcast_id,
        } = body as any;

        if (!title || !msgBody) return json({ error: "title and body are required" }, 400);

        // Resolve recipient user IDs from DB
        const { data: recipients, error: audErr } = await db.rpc(
            "resolve_notification_audience",
            { p_audience: audience, p_custom_ids: body.custom_user_ids ?? null }
        );
        if (audErr) return json({ error: audErr.message }, 500);
        if (!recipients?.length) return json({ message: "No recipients found", count: 0 });

        // For each recipient, get their contact info, insert notification, deliver
        let successCount = 0;
        let failCount = 0;

        for (const { user_id } of recipients) {
            try {
                // Fetch user contact details from auth.users (service role)
                const { data: authUser } = await db.auth.admin.getUserById(user_id);
                const userEmail = authUser?.user?.email;
                const userPhone = authUser?.user?.phone;

                const finalTitle = interpolate(String(title), vars as any);
                const finalBody = interpolate(String(msgBody), vars as any);

                const notifId = await insertNotification(db, {
                    user_id,
                    title: finalTitle,
                    body: finalBody,
                    type: String(type),
                    channels: channels as string[],
                    action_url: action_url as string | undefined,
                    metadata: metadata as Record<string, unknown> | undefined,
                });

                await deliverNotification(
                    db, notifId, user_id,
                    userEmail, userPhone,
                    finalTitle, finalBody,
                    channels as string[],
                    action_url as string | undefined,
                    broadcast_id as string | undefined
                );
                successCount++;
            } catch (e) {
                console.error(`[notif] Failed for user ${user_id}:`, e);
                failCount++;
            }
        }

        return json({
            success: true,
            sent: successCount,
            failed: failCount,
            total_recipients: recipients.length,
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ACTION: trigger — fire a template for a single user event
    // Body: { action: 'trigger', template_slug, user_id, vars, channels? }
    // ══════════════════════════════════════════════════════════════════════
    if (action === "trigger") {
        const { template_slug, user_id, vars = {}, channels: override_channels } = body as any;
        if (!template_slug || !user_id) {
            return json({ error: "template_slug and user_id are required" }, 400);
        }

        // Fetch template
        const { data: tmpl, error: tmplErr } = await db
            .from("notification_templates")
            .select("*")
            .eq("slug", template_slug)
            .eq("is_active", true)
            .single();

        if (tmplErr || !tmpl) return json({ error: "Template not found or inactive" }, 404);

        const channels = override_channels ?? tmpl.channels;
        const title = interpolate(tmpl.title, vars);
        const msgBody = interpolate(tmpl.body, vars);

        // Get user contact info
        const { data: authUser } = await db.auth.admin.getUserById(user_id);
        const userEmail = authUser?.user?.email;
        const userPhone = authUser?.user?.phone;

        const notifId = await insertNotification(db, {
            user_id,
            title,
            body: msgBody,
            type: tmpl.type,
            channels,
            metadata: { template_slug, vars },
        });

        const deliveryResults = await deliverNotification(
            db, notifId, user_id,
            userEmail, userPhone,
            title, msgBody,
            channels
        );

        return json({ success: true, notification_id: notifId, delivery: deliveryResults });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ACTION: process_scheduled — run overdue scheduled notifications
    // Called by pg_cron every 5 minutes
    // ══════════════════════════════════════════════════════════════════════
    if (action === "process_scheduled") {
        const now = new Date().toISOString();

        const { data: due, error: dueErr } = await db
            .from("scheduled_notifications")
            .select("*")
            .eq("status", "scheduled")
            .lte("scheduled_at", now)
            .limit(20);

        if (dueErr) return json({ error: dueErr.message }, 500);
        if (!due?.length) return json({ message: "No scheduled notifications due", count: 0 });

        let processed = 0;

        for (const sched of due) {
            try {
                // Mark as processing to prevent double-processing
                await db.from("scheduled_notifications").update({ status: "processing" }).eq("id", sched.id);

                const { data: recipients } = await db.rpc("resolve_notification_audience", {
                    p_audience: sched.audience,
                    p_custom_ids: sched.custom_user_ids ?? null,
                });

                let success = 0;
                for (const { user_id } of (recipients ?? [])) {
                    try {
                        const { data: authUser } = await db.auth.admin.getUserById(user_id);
                        const userEmail = authUser?.user?.email;
                        const userPhone = authUser?.user?.phone;
                        const title = interpolate(sched.title, sched.metadata?.vars ?? {});
                        const msgBody = interpolate(sched.body, sched.metadata?.vars ?? {});

                        const notifId = await insertNotification(db, {
                            user_id,
                            title,
                            body: msgBody,
                            type: sched.type,
                            channels: sched.channel,
                            action_url: sched.action_url ?? undefined,
                            metadata: { scheduled_notification_id: sched.id },
                        });

                        await deliverNotification(
                            db, notifId, user_id,
                            userEmail, userPhone,
                            title, msgBody,
                            sched.channel,
                            sched.action_url ?? undefined,
                            sched.id
                        );
                        success++;
                    } catch (e) {
                        console.error(`[notif] Scheduled delivery failed for user ${user_id}:`, e);
                    }
                }

                await db.from("scheduled_notifications").update({
                    status: "sent",
                    sent_at: new Date().toISOString(),
                    recipient_count: success,
                }).eq("id", sched.id);

                processed++;
            } catch (e) {
                console.error(`[notif] Scheduled notification ${sched.id} failed:`, e);
                await db.from("scheduled_notifications").update({ status: "failed" }).eq("id", sched.id);
            }
        }

        return json({ success: true, processed, total_due: due.length });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ACTION: retry_failed — retry pending/failed logs
    // ══════════════════════════════════════════════════════════════════════
    if (action === "retry_failed") {
        const { data: failedLogs, error: failErr } = await db
            .from("notification_logs")
            .select("*, notifications(*)")
            .in("status", ["failed", "pending"])
            .lt("retry_count", 3)
            .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
            .limit(50);

        if (failErr) return json({ error: failErr.message }, 500);

        let retried = 0;
        for (const log of (failedLogs ?? [])) {
            const notif = (log as any).notifications;
            if (!notif || !log.user_id) continue;

            try {
                const { data: authUser } = await db.auth.admin.getUserById(log.user_id);
                const userEmail = authUser?.user?.email;
                const userPhone = authUser?.user?.phone;

                let status = "failed";
                let providerId: string | null = null;

                if (log.channel === "email" && userEmail) {
                    const html = buildEmailHTML(notif.title, notif.body, notif.action_url);
                    const res = await sendEmail(userEmail, notif.title, html, notif.body);
                    status = res.ok ? "delivered" : "failed";
                    providerId = res.id;
                } else if (log.channel === "sms" && userPhone) {
                    const res = await sendSMS(userPhone, `${notif.title}\n${notif.body}`);
                    status = res.ok ? "delivered" : "failed";
                    providerId = res.id;
                }

                await db.from("notification_logs").update({
                    status,
                    provider_message_id: providerId,
                    retry_count: (log.retry_count ?? 0) + 1,
                    next_retry_at: status === "failed"
                        ? new Date(Date.now() + ((log.retry_count + 1) * 15 * 60 * 1000)).toISOString()
                        : null,
                }).eq("id", log.id);

                retried++;
            } catch (e) {
                console.error(`[notif] Retry failed for log ${log.id}:`, e);
            }
        }

        return json({ success: true, retried, checked: (failedLogs ?? []).length });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ACTION: track — mark opened or clicked
    // Body: { action: 'track', log_id, event: 'open' | 'click' }
    // ══════════════════════════════════════════════════════════════════════
    if (action === "track") {
        const { log_id, event } = body as any;
        if (!log_id || !event) return json({ error: "log_id and event required" }, 400);

        const update: Record<string, unknown> = {};
        if (event === "open") { update.opened_at = new Date().toISOString(); update.status = "delivered"; }
        if (event === "click") { update.clicked_at = new Date().toISOString(); }

        await db.from("notification_logs").update(update).eq("id", log_id);
        return json({ success: true });
    }

    return json({ error: "Invalid action. Use: broadcast | trigger | process_scheduled | retry_failed | track" }, 400);
});
