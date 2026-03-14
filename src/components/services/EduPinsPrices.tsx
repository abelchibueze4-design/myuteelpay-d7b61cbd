import { useMemo } from "react";
import { useKvdataQuery } from "@/hooks/useKvdata";
import { PriceCard } from "../common/PriceCard";
import { Loader2 } from "lucide-react";

interface EduPinsPricesProps {
  onSelect: (exam: any) => void;
  selectedExamName?: string;
}

export const EduPinsPrices = ({ onSelect, selectedExamName }: EduPinsPricesProps) => {
  const { data: apiPlans, isLoading, error } = useKvdataQuery({ action: "get_edu_plans" });

  const exams = useMemo(() => {
    if (!apiPlans) return [];
    const plansArray = Array.isArray(apiPlans) ? apiPlans : (apiPlans.plans || []);
    return plansArray.map((p: any) => ({
        name: p.exam_name || p.name,
        id: String(p.id || p.plan_id),
        price: Number(p.plan_amount || p.amount || p.price),
        raw: p
    }));
  }, [apiPlans]);

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
        <p className="font-bold text-sm">Failed to load exams</p>
        <p className="text-xs opacity-80 mt-1">Please check your connection and try again.</p>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="p-8 text-center bg-secondary/30 text-muted-foreground rounded-2xl border-2 border-dashed border-border/50">
        <p className="font-bold text-sm">No exams found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {exams.map((exam: any) => (
        <PriceCard
          key={exam.id}
          label={exam.name}
          price={exam.price}
          active={selectedExamName === exam.name}
          onClick={() => onSelect(exam)}
        />
      ))}
    </div>
  );
};
