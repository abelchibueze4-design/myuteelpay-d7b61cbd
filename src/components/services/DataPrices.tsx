import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useKvdataQuery } from "@/hooks/useKvdata";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { PriceCard } from "../common/PriceCard";
import { Loader2 } from "lucide-react";

interface DataPricesProps {
  networkName: string;
  category?: string;
  onSelect: (plan: any) => void;
  selectedPlanId?: string;
}

export const DataPrices = ({ networkName, category, onSelect, selectedPlanId }: DataPricesProps) => {
  const { settings } = usePlatformSettings();
  const isVtpass = settings.data_provider === "vtpass";

  // VTPass: fetch live plans from API
  const { data: apiPlans, isLoading: apiLoading, error: apiError } = useKvdataQuery(
    { action: "get_data_plans" },
    isVtpass && !!networkName
  );

  // KVData: fetch from database
  const { data: dbPlans, isLoading: dbLoading, error: dbError } = useQuery({
    queryKey: ["data_plans", networkName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_plans")
        .select("*")
        .eq("network_name", networkName);
      if (error) throw error;
      return data || [];
    },
    enabled: !isVtpass && !!networkName
  });

  const isLoading = isVtpass ? apiLoading : dbLoading;
  const error = isVtpass ? apiError : dbError;

  const filteredPlans = useMemo(() => {
    if (isVtpass) {
      if (!apiPlans) return [];
      const plansArray = Array.isArray(apiPlans) ? apiPlans : (apiPlans.plans || []);
      return plansArray
        .filter((p: any) => {
          const pNetwork = (p.network_name || "").toUpperCase();
          const target = networkName.toUpperCase();
          return pNetwork === target;
        })
        .filter((p: any) => !category || (p.plan_type || "").toUpperCase() === category.toUpperCase())
        .map((p: any) => ({
          label: p.size || p.name || `${p.plan_type} ${p.plan_size}`,
          plan_id: String(p.plan_id || p.variation_code || p.id),
          price: Number(p.amount || p.variation_amount || p.price),
          type: p.plan_type,
          raw: p
        }));
    }

    // KVData DB plans
    if (!dbPlans) return [];
    return dbPlans
      .filter((p) => !category || p.plan_type === category)
      .map((p) => ({
        label: `${p.size} - ${p.validity}`,
        plan_id: String(p.plan_id),
        price: Number(p.amount),
        type: p.plan_type,
        raw: p
      }));
  }, [isVtpass, apiPlans, dbPlans, networkName, category]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 text-destructive rounded-2xl">
        <p className="font-bold text-sm">Failed to load plans</p>
        <p className="text-xs opacity-80 mt-1">Please check your connection and try again.</p>
      </div>
    );
  }

  if (filteredPlans.length === 0) {
    return (
      <div className="p-8 text-center bg-secondary/30 text-muted-foreground rounded-2xl border-2 border-dashed border-border/50">
        <p className="font-bold text-sm">No plans found</p>
        <p className="text-xs mt-1">Try selecting a different network or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {filteredPlans.map((plan: any) => (
        <PriceCard
          key={plan.plan_id}
          label={plan.label}
          price={plan.price}
          active={selectedPlanId === plan.plan_id}
          onClick={() => onSelect(plan)}
        />
      ))}
    </div>
  );
};