import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PriceCardProps {
  label: string;
  price: number;
  onClick: () => void;
  className?: string;
  active?: boolean;
}

export const PriceCard = ({ label, price, onClick, className, active }: PriceCardProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3 h-auto rounded-xl border-2 transition-all text-center w-full min-h-[72px]",
        active 
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
          : "border-border/50 hover:border-primary/30",
        className
      )}
    >
      <span className="font-bold text-xs tracking-tight mb-0.5 line-clamp-2">{label}</span>
      <span className="text-[11px] text-primary font-black uppercase tracking-wider">₦{price.toLocaleString()}</span>
    </Button>
  );
};
