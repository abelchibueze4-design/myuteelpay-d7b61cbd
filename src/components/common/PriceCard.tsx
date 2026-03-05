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
        "flex flex-col items-start p-4 h-auto rounded-2xl border-2 transition-all text-left w-full",
        active 
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
          : "border-border/50 hover:border-primary/30",
        className
      )}
    >
      <span className="font-bold text-sm tracking-tight mb-1">{label}</span>
      <span className="text-xs text-primary font-black uppercase tracking-wider">₦{price.toLocaleString()}</span>
    </Button>
  );
};
