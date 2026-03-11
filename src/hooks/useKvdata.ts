import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlatformSettings, ApiProvider } from "@/hooks/usePlatformSettings";

// Map action names to provider setting keys
const ACTION_PROVIDER_MAP: Record<string, keyof ReturnType<typeof usePlatformSettings>["settings"]> = {
  buy_airtime: "airtime_provider",
  get_data_plans: "data_provider",
  buy_data: "data_provider",
  get_cable_plans: "cable_provider",
  buy_cable: "cable_provider",
  validate_iuc: "cable_provider",
  buy_electricity: "electricity_provider",
  validate_meter: "electricity_provider",
  get_edu_plans: "edu_pins_provider",
  buy_edu_pin: "edu_pins_provider",
  get_datacard_plans: "data_card_provider",
  buy_data_card: "data_card_provider",
  buy_bulk_sms: "bulk_sms_provider",
  // International & Insurance always use vtpass
  get_intl_countries: "airtime_provider",
  get_intl_product_types: "airtime_provider",
  get_intl_operators: "airtime_provider",
  get_intl_variations: "airtime_provider",
  buy_intl_airtime: "airtime_provider",
  get_insurance_plans: "electricity_provider",
  buy_insurance: "electricity_provider",
};

async function callProvider(body: Record<string, unknown>, provider: ApiProvider) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const functionName = provider === "vtpass" ? "vtpass" : "kvdata";
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function useKvdata() {
  const queryClient = useQueryClient();
  const { settings } = usePlatformSettings();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      const action = body.action as string;
      const providerKey = ACTION_PROVIDER_MAP[action];
      const provider = (providerKey ? settings[providerKey] : "kvdata") as ApiProvider;
      return callProvider(body, provider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: () => {
      toast.error("An error occurred. Please try again.");
    },
  });
}

export function useKvdataQuery(body: Record<string, unknown>, enabled = true) {
  const { settings } = usePlatformSettings();
  const action = body.action as string;
  const providerKey = ACTION_PROVIDER_MAP[action];
  const provider = (providerKey ? settings[providerKey] : "kvdata") as ApiProvider;

  return useQuery({
    queryKey: ["kvdata", body, provider],
    queryFn: () => callProvider(body, provider),
    enabled: enabled,
  });
}
