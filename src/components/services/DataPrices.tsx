import { useMemo } from "react";
import { useKvdataQuery } from "@/hooks/useKvdata";
import { PriceCard } from "../common/PriceCard";
import { Loader2 } from "lucide-react";

interface DataPricesProps {
  networkId: number;
  category?: string;
  onSelect: (plan: any) => void;
  selectedPlanId?: string;
}

export const DataPrices = ({ networkId, category, onSelect, selectedPlanId }: DataPricesProps) => {
  const { data: apiPlans, isLoading, error } = useKvdataQuery({ action: "get_data_plans" });

  const filteredPlans = useMemo(() => {
    if (!apiPlans || !networkId) return [];
    const plansArray = Array.isArray(apiPlans) ? apiPlans : (apiPlans.plans || []);
    return plansArray
      .filter((p: any) => 
        p.network === networkId && 
        (!category || (p.plan_type || "Standard") === category)
      )
      .map((p: any) => ({
        label: p.plan_name || p.name || `${p.plan_type} ${p.plan_size}`,
        plan_id: String(p.id || p.plan_id),
        price: Number(p.plan_amount || p.amount || p.price),
        raw: p
      }));
  }, [apiPlans, networkId, category]);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
