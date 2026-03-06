import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PriceCard } from "../common/PriceCard";
import { Loader2 } from "lucide-react";

interface CableTVPricesProps {
  providerId: number;
  onSelect: (plan: any) => void;
  selectedPlanId?: string;
}

export const CableTVPrices = ({ providerId, onSelect, selectedPlanId }: CableTVPricesProps) => {
  const { data: dbPlans, isLoading, error } = useQuery({
    queryKey: ["cable_plans", providerId],
    queryFn: async () => {
      // Get provider UUID first
      const { data: provider, error: pError } = await supabase
        .from("cable_providers")
        .select("id")
        .eq("provider_id", providerId)
        .single();
      
      if (pError || !provider) throw new Error("Provider not found");

      const { data, error } = await supabase
        .from("cable_plans")
        .select("*")
        .eq("provider_id", provider.id)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!providerId
  });

  const filteredPlans = useMemo(() => {
    if (!dbPlans) return [];
    
    return dbPlans.map((p: any) => ({
      label: p.name,
      plan_id: String(p.plan_id),
      price: Number(p.price),
      raw: p
    }));
  }, [dbPlans]);

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
        <p className="font-bold text-sm">Failed to load packages</p>
        <p className="text-xs opacity-80 mt-1">Please check your connection and try again.</p>
      </div>
    );
  }

  if (filteredPlans.length === 0) {
    return (
      <div className="p-8 text-center bg-secondary/30 text-muted-foreground rounded-2xl border-2 border-dashed border-border/50">
        <p className="font-bold text-sm">No packages found</p>
        <p className="text-xs mt-1">Try selecting a different provider.</p>
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
