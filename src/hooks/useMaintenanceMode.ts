import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceMode() {
  const { data: isMaintenanceMode = false, isLoading } = useQuery({
    queryKey: ["maintenance-mode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_configurations")
        .select("config_data")
        .eq("platform", "admin_settings")
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return false;
      const config = data.config_data as Record<string, unknown>;
      return (config?.maintenance_mode as boolean) ?? false;
    },
    refetchInterval: 60000, // check every minute
    staleTime: 30000,
  });

  return { isMaintenanceMode, isLoading };
}
