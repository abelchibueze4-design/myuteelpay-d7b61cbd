import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PriceCard } from "../common/PriceCard";
import { Loader2 } from "lucide-react";

interface DataPricesProps {
  networkId: number;
  category?: string;
  onSelect: (plan: any) => void;
  selectedPlanId?: string;
}

type NetworkRow = {
  id: string;
};

type DataPlanRow = {
  id: string;
  plan_id: number;
  name: string;
  price: number;
  type: string;
};

export const DataPrices = ({ networkId, category, onSelect, selectedPlanId }: DataPricesProps) => {
  const { data: dbPlans, isLoading, error } = useQuery({
    queryKey: ["data_plans", networkId],
    queryFn: async () => {
      const db = supabase as any;
      const { data: network, error: netError } = await db
        .from("networks")
        .select("id")
        .eq("provider_id", networkId)
        .single();
      
      if (netError || !network) throw new Error("Network not found");
      const networkRow = network as NetworkRow;

      const { data, error } = await db
        .from("data_plans")
        .select("*")
        .eq("network_id", networkRow.id)
        .eq("is_active", true);
      
      if (error) throw error;
      return (data || []) as DataPlanRow[];
    },
    enabled: !!networkId
  });

  const filteredPlans = useMemo(() => {
    if (!dbPlans) return [];
    
    return dbPlans
      .filter((p) => 
        (!category || (p.type || "Standard") === category)
      )
      .map((p) => ({
        label: p.name,
        plan_id: String(p.plan_id),
        price: Number(p.price),
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
