import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminBadges() {
  return useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const [kycRes, txRes, reconRes, usersRes] = await Promise.all([
        supabase.from("kyc_submissions" as any).select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("transactions").select("id", { count: "exact", head: true }).in("status", ["pending", "failed"]),
        supabase.from("reconciliation_cases").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        kycPending: kycRes.count ?? 0,
        txIssues: txRes.count ?? 0,
        reconOpen: reconRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
      };
    },
    refetchInterval: 30000, // refresh every 30s
  });
}
