import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useKvdataQuery } from "@/hooks/useKvdata";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { applyMarkup } from "@/lib/applyMarkup";
import { PriceCard } from "../common/PriceCard";
import { Loader2 } from "lucide-react";

const CABLE_ID_NAME_MAP: Record<number, string> = {
  1: "GOTV",
  2: "DSTV",
  3: "STARTIMES",
  4: "SHOWMAX",
};

interface CableTVPricesProps {
  cableId: number;
  onSelect: (plan: any) => void;
  selectedPlanId?: string;
}

export const CableTVPrices = ({ cableId, onSelect, selectedPlanId }: CableTVPricesProps) => {
  const { settings } = usePlatformSettings();
  const isVtpass = settings.cable_provider === "vtpass";
  const cableName = CABLE_ID_NAME_MAP[cableId] || "";
  const markup = settings.cable_markup || 0;

  const { data: apiPlans, isLoading: apiLoading, error: apiError } = useKvdataQuery(
    { action: "get_cable_plans" },
    isVtpass && !!cableId
  );

  const { data: dbPlans, isLoading: dbLoading, error: dbError } = useQuery({
    queryKey: ["cable_plans", cableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cable_plans")
        .select("*")
        .eq("cable_id", cableId);
      if (error) throw error;
      return data || [];
    },
    enabled: !isVtpass && !!cableId
  });

  const isLoading = isVtpass ? apiLoading : dbLoading;
  const error = isVtpass ? apiError : dbError;

  const formatLabel = (name: string) => {
    const parts = name.split(/\s*\+\s*/);
    if (parts.length <= 2) return name;
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      const chunk = parts.slice(i, i + 2).join(" + ");
      lines.push(chunk);
    }
    return lines.join("\n+ ");
  };

  const filteredPlans = useMemo(() => {
    if (isVtpass) {
      if (!apiPlans) return [];
      const plansArray = Array.isArray(apiPlans) ? apiPlans : (apiPlans.plans || []);
      return plansArray
        .filter((p: any) => {
          const pCable = (p.cable_name || "").toUpperCase();
          return pCable === cableName;
        })
        .map((p: any) => {
          const basePrice = Number(p.cableplan_amount || p.variation_amount || p.amount);
          return {
            label: formatLabel(p.cableplan_name || p.name),
            plan_id: String(p.cableplan_id || p.variation_code || p.id),
            price: applyMarkup(basePrice, markup),
            basePrice,
            raw: { ...p, cable_name: p.cable_name }
          };
        });
    }

    if (!dbPlans) return [];
    return dbPlans.map((p) => {
      const basePrice = Number(p.cableplan_amount);
      return {
        label: formatLabel(p.cableplan_name),
        plan_id: String(p.cableplan_id),
        price: applyMarkup(basePrice, markup),
        basePrice,
        raw: p
      };
    });
  }, [isVtpass, apiPlans, dbPlans, cableName, markup]);

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
    <div className="grid grid-cols-2 gap-3">
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
