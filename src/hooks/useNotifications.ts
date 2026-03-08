import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Notification {
    id: string;
    user_id: string | null;
    title: string;
    body: string;
    type: string;
    channel: string[];
    is_read: boolean;
    read_at: string | null;
    action_url: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

export interface NotificationLog {
    id: string;
    notification_id: string;
    broadcast_id: string | null;
    user_id: string | null;
    channel: string;
    status: "pending" | "sent" | "delivered" | "failed" | "bounced";
    provider: string | null;
    provider_message_id: string | null;
    error_message: string | null;
    opened_at: string | null;
    clicked_at: string | null;
    retry_count: number;
    next_retry_at: string | null;
    sent_at: string | null;
    created_at: string;
}

export interface ScheduledNotification {
    id: string;
    title: string;
    body: string;
    type: string;
    audience: string;
    custom_user_ids: string[] | null;
    channel: string[];
    action_url: string | null;
    metadata: Record<string, unknown> | null;
    status: "scheduled" | "processing" | "sent" | "cancelled" | "failed";
    scheduled_at: string;
    sent_at: string | null;
    recipient_count: number | null;
    created_by: string | null;
    created_at: string;
}

export interface NotificationTemplate {
    id: string;
    slug: string;
    title: string;
    body: string;
    type: string;
    channels: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface NotificationStats {
    total_sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    pending: number;
    open_rate_pct: number;
    click_rate_pct: number;
}

// ─── Helper: call notification-engine Edge Function ───────────────────────────
async function callNotifEngine(body: Record<string, unknown>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? "";
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notification-engine`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Notification engine error");
    }
    return res.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** All notification logs for admin */
export const useNotificationLogs = (status?: string) => {
    return useQuery({
        queryKey: ["notification_logs", status],
        queryFn: async () => {
            let q = (supabase as any)
                .from("notification_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(200);
            if (status && status !== "all") q = q.eq("status", status);
            const { data, error } = await q;
            if (error) throw error;
            return (data ?? []) as NotificationLog[];
        },
        refetchInterval: 15000,
    });
};

/** Scheduled notifications */
export const useScheduledNotifications = () => {
    return useQuery({
        queryKey: ["scheduled_notifications"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("scheduled_notifications")
                .select("*")
                .order("scheduled_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as ScheduledNotification[];
        },
        refetchInterval: 30000,
    });
};

/** Notification templates */
export const useNotificationTemplates = () => {
    return useQuery({
        queryKey: ["notification_templates"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("notification_templates")
                .select("*")
                .order("slug");
            if (error) throw error;
            return (data ?? []) as NotificationTemplate[];
        },
    });
};

/** Delivery stats from view */
export const useNotificationStats = () => {
    return useQuery({
        queryKey: ["notification_stats"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("v_notification_stats")
                .select("*")
                .single();
            if (error) throw error;
            return data as NotificationStats | null;
        },
        refetchInterval: 30000,
    });
};

/** User's own in-app notifications */
export const useMyNotifications = () => {
    const qc = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel("my-notifications-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                () => {
                    qc.invalidateQueries({ queryKey: ["my_notifications"] });
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [qc]);

    return useQuery({
        queryKey: ["my_notifications"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);
            if (error) throw error;
            return (data ?? []) as Notification[];
        },
        refetchInterval: 10000,
    });
};

/** Broadcast to segment */
export const useBroadcast = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            title: string;
            body: string;
            type?: string;
            audience: string;
            channels: string[];
            action_url?: string;
            vars?: Record<string, string>;
            custom_user_ids?: string[];
        }) => {
            return callNotifEngine({ action: "broadcast", ...payload });
        },
        onSuccess: (data) => {
            toast.success(
                `Broadcast sent! ${data.sent} delivered, ${data.failed} failed out of ${data.total_recipients} recipients.`
            );
            qc.invalidateQueries({ queryKey: ["notification_logs"] });
            qc.invalidateQueries({ queryKey: ["notification_stats"] });
        },
        onError: (err: Error) => toast.error("Broadcast failed: " + err.message),
    });
};

/** Smart trigger for a specific template + user */
export const useTriggerNotification = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            template_slug: string;
            user_id: string;
            vars?: Record<string, string>;
            channels?: string[];
        }) => {
            return callNotifEngine({ action: "trigger", ...payload });
        },
        onSuccess: () => {
            toast.success("Notification triggered successfully");
            qc.invalidateQueries({ queryKey: ["notification_logs"] });
        },
        onError: (err: Error) => toast.error("Trigger failed: " + err.message),
    });
};

/** Schedule a notification */
export const useScheduleNotification = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            title: string;
            body: string;
            type?: string;
            audience?: string;
            channels?: string[];
            scheduled_at: string;
            action_url?: string;
        }) => {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;

            const { data, error } = await (supabase as any)
                .from("scheduled_notifications")
                .insert({
                    ...payload,
                    type: payload.type ?? "general",
                    audience: payload.audience ?? "all",
                    channel: payload.channels ?? ["in_app"],
                    created_by: userId,
                })
                .select("id")
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success("Notification scheduled successfully");
            qc.invalidateQueries({ queryKey: ["scheduled_notifications"] });
        },
        onError: (err: Error) => toast.error("Schedule failed: " + err.message),
    });
};

/** Cancel a scheduled notification */
export const useCancelScheduled = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("scheduled_notifications")
                .update({ status: "cancelled" })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Scheduled notification cancelled");
            qc.invalidateQueries({ queryKey: ["scheduled_notifications"] });
        },
    });
};

/** Retry failed deliveries */
export const useRetryFailed = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => callNotifEngine({ action: "retry_failed" }),
        onSuccess: (data) => {
            toast.success(`Retried ${data.retried} failed deliveries`);
            qc.invalidateQueries({ queryKey: ["notification_logs"] });
        },
        onError: (err: Error) => toast.error("Retry failed: " + err.message),
    });
};

/** Toggle template active state */
export const useToggleTemplate = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await (supabase as any)
                .from("notification_templates")
                .update({ is_active })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notification_templates"] });
            toast.success("Template updated");
        },
    });
};

/** Mark user notification as read */
export const useMarkRead = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("notifications")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my_notifications"] }),
    });
};
