import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Enforces platform-level security policies before allowing a transaction.
 * Returns a `guardTransaction` function that checks all policies and returns
 * an object with `allowed` boolean and optional `reason` string.
 */
export function useTransactionGuard() {
  const { settings } = usePlatformSettings();
  const { user } = useAuth();

  // Fetch user profile for KYC & PIN status
  const { data: profile } = useQuery({
    queryKey: ["guard-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("kyc_verified, transaction_pin_enabled, transaction_pin_hash")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's total spend for daily limit enforcement
  const { data: dailySpend = 0 } = useQuery({
    queryKey: ["daily-spend", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("status", "success")
        .neq("type", "wallet_fund")
        .gte("created_at", today);
      if (error) return 0;
      return (data || []).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    },
    enabled: !!user?.id,
    staleTime: 10000,
  });

  const guardTransaction = (amount: number): { allowed: boolean; reason?: string } => {
    // Force transaction PIN check
    if (settings.force_transaction_pin) {
      const hasPinSet = profile?.transaction_pin_enabled && !!profile?.transaction_pin_hash;
      if (!hasPinSet) {
        toast.error("You must set a transaction PIN before making purchases. Go to Settings → Security.");
        return { allowed: false, reason: "Transaction PIN required" };
      }
    }

    // KYC requirement
    if (settings.require_kyc_for_transactions) {
      if (!profile?.kyc_verified) {
        toast.error("KYC verification is required before making transactions. Go to Settings → KYC.");
        return { allowed: false, reason: "KYC verification required" };
      }
    }

    // Single transaction limit
    if (amount > settings.max_single_transaction) {
      toast.error(`Transaction exceeds maximum limit of ₦${settings.max_single_transaction.toLocaleString()}`);
      return { allowed: false, reason: "Exceeds single transaction limit" };
    }

    // Daily transaction limit
    if (dailySpend + amount > settings.max_daily_transaction) {
      toast.error(`This would exceed your daily spending limit of ₦${settings.max_daily_transaction.toLocaleString()}`);
      return { allowed: false, reason: "Exceeds daily transaction limit" };
    }

    return { allowed: true };
  };

  return { guardTransaction, settings };
}
