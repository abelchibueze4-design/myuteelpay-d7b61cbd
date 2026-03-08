import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformSettings {
  maintenance_mode: boolean;
  new_signups_enabled: boolean;
  platform_name: string;
  session_timeout: string;
  force_transaction_pin: boolean;
  max_login_attempts: number;
  min_password_length: number;
  require_kyc_for_transactions: boolean;
  disable_suspicious_accounts: boolean;
  ip_whitelist_enabled: boolean;
  ip_whitelist: string;
  max_daily_transaction: number;
  max_single_transaction: number;
  min_wallet_fund: number;
  service_status: "operational" | "degraded" | "outage";
  service_status_message: string;
}

const defaults: PlatformSettings = {
  maintenance_mode: false,
  new_signups_enabled: true,
  platform_name: "UteelPay",
  session_timeout: "30m",
  force_transaction_pin: false,
  max_login_attempts: 15,
  min_password_length: 8,
  require_kyc_for_transactions: false,
  disable_suspicious_accounts: true,
  ip_whitelist_enabled: false,
  ip_whitelist: "",
  max_daily_transaction: 100000,
  max_single_transaction: 50000,
  min_wallet_fund: 100,
  service_status: "operational",
  service_status_message: "All services are running smoothly",
};

export function usePlatformSettings() {
  const { data: settings = defaults, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_configurations")
        .select("config_data")
        .eq("platform", "admin_settings")
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return defaults;
      const d = data.config_data as Record<string, unknown>;
      return { ...defaults, ...d } as PlatformSettings;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  return { settings, isLoading };
}
