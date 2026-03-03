import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ReconciliationCase {
    id: string;
    transaction_id: string | null;
    reference: string | null;
    issue_type:
    | "payment_not_delivered"
    | "service_undeducted"
    | "duplicate"
    | "missing_webhook"
    | "profit_mismatch"
    | "wallet_mismatch";
    description: string;
    expected_amount: number | null;
    actual_amount: number | null;
    variance: number | null;
    status: "open" | "resolved" | "escalated" | "fraud" | "false_positive";
    admin_notes: string | null;
    severity: "low" | "medium" | "high" | "critical";
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface ReconciliationReport {
    id: string;
    report_date: string;
    total_deposits: number;
    total_withdrawals: number;
    total_service_cost: number;
    expected_profit: number;
    actual_profit: number;
    profit_variance: number;
    total_transactions: number;
    successful_txns: number;
    failed_txns: number;
    duplicate_count: number;
    missing_webhook_count: number;
    mismatch_count: number;
    failure_rate: number;
    email_sent: boolean;
    generated_at: string;
}

export interface DailyTransactionSummary {
    txn_date: string;
    total_count: number;
    success_count: number;
    failed_count: number;
    pending_count: number;
    total_deposits: number;
    total_service_spend: number;
    net_movement: number;
    failure_rate_pct: number;
}

// ─── Fetch reconciliation cases ───────────────────────────────────────────────
export const useReconciliationCases = (status?: string) => {
    return useQuery({
        queryKey: ["reconciliation_cases", status],
        queryFn: async () => {
            let query = (supabase as any)
                .from("reconciliation_cases")
                .select("*")
                .order("created_at", { ascending: false });
            if (status && status !== "all") {
                query = query.eq("status", status);
            }
            const { data, error } = await query;
            if (error) throw error;
            return (data ?? []) as ReconciliationCase[];
        },
        refetchInterval: 30000, // auto-refresh every 30s
    });
};

// ─── Fetch latest reconciliation reports ─────────────────────────────────────
export const useReconciliationReports = (days = 30) => {
    return useQuery({
        queryKey: ["reconciliation_reports", days],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("reconciliation_reports")
                .select("*")
                .order("report_date", { ascending: false })
                .limit(days);
            if (error) throw error;
            return (data ?? []) as ReconciliationReport[];
        },
    });
};

// ─── Fetch today's report ─────────────────────────────────────────────────────
export const useTodayReport = () => {
    const today = new Date().toISOString().slice(0, 10);
    return useQuery({
        queryKey: ["reconciliation_today", today],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("reconciliation_reports")
                .select("*")
                .eq("report_date", today)
                .maybeSingle();
            if (error) throw error;
            return data as ReconciliationReport | null;
        },
        refetchInterval: 60000,
    });
};

// ─── Fetch daily transaction summary view ─────────────────────────────────────
export const useDailySummary = (days = 14) => {
    return useQuery({
        queryKey: ["daily_tx_summary", days],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("v_daily_transaction_summary")
                .select("*")
                .limit(days);
            if (error) throw error;
            return (data ?? []) as DailyTransactionSummary[];
        },
    });
};

// ─── Update reconciliation case ───────────────────────────────────────────────
export const useUpdateCase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            status,
            admin_notes,
        }: {
            id: string;
            status?: string;
            admin_notes?: string;
        }) => {
            const { error } = await (supabase as any)
                .from("reconciliation_cases")
                .update({
                    ...(status && { status }),
                    ...(admin_notes !== undefined && { admin_notes }),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reconciliation_cases"] });
            toast.success("Case updated successfully");
        },
        onError: (err: Error) => {
            toast.error("Failed to update case: " + err.message);
        },
    });
};

// ─── Trigger manual reconciliation run via Edge Function ──────────────────────
export const useTriggerReconciliation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (date?: string) => {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token ?? "";

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
            const res = await fetch(
                `${supabaseUrl}/functions/v1/reconciliation-cron`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ date: date ?? new Date().toISOString().slice(0, 10) }),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Reconciliation failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(
                `Reconciliation complete! ${data.alerts?.length ?? 0} alerts generated.`
            );
            queryClient.invalidateQueries({ queryKey: ["reconciliation_cases"] });
            queryClient.invalidateQueries({ queryKey: ["reconciliation_reports"] });
            queryClient.invalidateQueries({ queryKey: ["reconciliation_today"] });
        },
        onError: (err: Error) => {
            toast.error("Reconciliation error: " + err.message);
        },
    });
};

// ─── Log admin action to audit_logs ──────────────────────────────────────────
export const useLogAdminAction = () => {
    return useMutation({
        mutationFn: async ({
            action,
            target_type,
            target_id,
            metadata,
        }: {
            action: string;
            target_type: string;
            target_id?: string;
            metadata?: Record<string, unknown>;
        }) => {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user;

            const { error } = await (supabase as any).from("audit_logs").insert({
                admin_id: user?.id ?? null,
                admin_email: user?.email ?? "unknown",
                action,
                target_type,
                target_id,
                metadata: metadata ?? {},
            });
            if (error) throw error;
        },
    });
};
