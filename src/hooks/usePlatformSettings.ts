import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ApiProvider = "kvdata" | "vtpass";
export type PaymentGateway = "paystack" | "paymentpoint" | "xixapay";

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
  service_status_visible: boolean;
  // Per-service API provider selection
  airtime_provider: ApiProvider;
  data_provider: ApiProvider;
  cable_provider: ApiProvider;
  electricity_provider: ApiProvider;
  edu_pins_provider: ApiProvider;
  data_card_provider: ApiProvider;
  // Exchange rate markup percentage
  exchange_rate_markup: number;
  // Wallet funding fee
  wallet_funding_fee: number;
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
  service_status_visible: false,
  airtime_provider: "vtpass",
  data_provider: "vtpass",
  cable_provider: "vtpass",
  electricity_provider: "vtpass",
  edu_pins_provider: "vtpass",
  data_card_provider: "vtpass",
  exchange_rate_markup: 0,
  wallet_funding_fee: 50,
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
