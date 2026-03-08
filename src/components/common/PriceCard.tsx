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
      <span className="font-medium text-[8px] leading-[1.2] mb-1 break-words hyphens-auto text-center w-full px-0.5" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', textAlign: 'center', display: 'block' }}>{label}</span>
      <span className="text-[9px] text-primary font-black uppercase tracking-wide">₦{price.toLocaleString()}</span>
    </Button>
  );
};
