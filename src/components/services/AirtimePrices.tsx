import { PriceCard } from "../common/PriceCard";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { applyMarkup } from "@/lib/applyMarkup";

interface AirtimePricesProps {
  onSelect: (amount: number) => void;
  selectedAmount?: number;
}

export const AirtimePrices = ({ onSelect, selectedAmount }: AirtimePricesProps) => {
  const { settings } = usePlatformSettings();
  const markup = settings.airtime_markup || 0;
  const denominations = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="grid grid-cols-3 gap-2">
      {denominations.map((amount) => {
        const markedUp = applyMarkup(amount, markup);
        return (
          <PriceCard
            key={amount}
            label={`₦${amount.toLocaleString()}`}
            price={markedUp}
            active={selectedAmount === markedUp}
            onClick={() => onSelect(markedUp)}
          />
        );
      })}
    </div>
  );
};
