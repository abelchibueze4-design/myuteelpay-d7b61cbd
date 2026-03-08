import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PriceCard } from "../common/PriceCard";
import { Loader2 } from "lucide-react";

interface DataPricesProps {
  networkName: string;
  category?: string;
  onSelect: (plan: any) => void;
  selectedPlanId?: string;
}

export const DataPrices = ({ networkName, category, onSelect, selectedPlanId }: DataPricesProps) => {
  const { data: dbPlans, isLoading, error } = useQuery({
    queryKey: ["data_plans", networkName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_plans")
        .select("*")
        .eq("network_name", networkName);
      if (error) throw error;
      return data || [];
    },
    enabled: !!networkName
  });

  const filteredPlans = useMemo(() => {
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
  }, [dbPlans, category]);

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
    <div className="grid grid-cols-2 gap-2.5">
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
