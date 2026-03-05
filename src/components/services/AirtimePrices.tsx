import { PriceCard } from "../common/PriceCard";

interface AirtimePricesProps {
  onSelect: (amount: number) => void;
  selectedAmount?: number;
}

export const AirtimePrices = ({ onSelect, selectedAmount }: AirtimePricesProps) => {
  const denominations = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {denominations.map((amount) => (
        <PriceCard
          key={amount}
          label={`₦${amount.toLocaleString()}`}
          price={amount}
          active={selectedAmount === amount}
          onClick={() => onSelect(amount)}
        />
      ))}
    </div>
  );
};
