import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HealthCheck {
  id: string;
  provider: string;
  status: string;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

export const useApiHealth = () => {
  const queryClient = useQueryClient();

  // Get latest health check per provider
  const { data: healthChecks, isLoading, refetch } = useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      // Get last 50 checks to show history
      const { data, error } = await supabase
        .from("api_health_checks")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as HealthCheck[];
    },
    refetchInterval: 60000, // Refresh every 60s
  });

  // Get latest status per provider
  const latestByProvider = healthChecks?.reduce<Record<string, HealthCheck>>((acc, check) => {
    if (!acc[check.provider]) {
      acc[check.provider] = check;
    }
    return acc;
  }, {}) ?? {};

  // Trigger a manual health check
  const runCheck = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("health-check");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-health"] });
      toast.success("Health check completed");
    },
    onError: (err: Error) => {
      toast.error(`Health check failed: ${err.message}`);
    },
  });

  return {
    healthChecks,
    latestByProvider,
    isLoading,
    refetch,
    runCheck: runCheck.mutate,
    isRunning: runCheck.isPending,
  };
};
