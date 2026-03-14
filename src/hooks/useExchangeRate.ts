import { useQuery } from "@tanstack/react-query";

const API_KEY = "4827a9be98d92897440c23ed74555012";
const BASE_URL = "https://api.exchangerate.host";

interface ExchangeRateResponse {
  success: boolean;
  quotes: Record<string, number>;
}

export const useExchangeRate = (sourceCurrency: string = "USD") => {
  return useQuery({
    queryKey: ["exchange-rate", sourceCurrency],
    queryFn: async (): Promise<number> => {
      const response = await fetch(
        `${BASE_URL}/live?access_key=${API_KEY}&source=${sourceCurrency}&currencies=NGN`
      );
      const data: ExchangeRateResponse = await response.json();
      
      if (!data.success) {
        throw new Error("Failed to fetch exchange rate");
      }

      // The key format is "SOURCENGN", e.g. "USDNGN"
      const rateKey = `${sourceCurrency}NGN`;
      const rate = data.quotes?.[rateKey];
      
      if (!rate) {
        throw new Error(`No rate found for ${sourceCurrency} to NGN`);
      }

      return rate;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!sourceCurrency,
  });
};

export const useAllExchangeRates = () => {
  return useQuery({
    queryKey: ["exchange-rates-all"],
    queryFn: async (): Promise<Record<string, number>> => {
      const response = await fetch(
        `${BASE_URL}/live?access_key=${API_KEY}&source=USD&currencies=NGN,EUR,GBP,ZAR,KES,GHS,XOF,XAF,EGP,MAD,TZS,UGX,RWF,ETB,INR,CNY,AED,SAR`
      );
      const data: ExchangeRateResponse = await response.json();

      if (!data.success) {
        throw new Error("Failed to fetch exchange rates");
      }

      // Convert all to NGN rates
      // quotes contains USD→X rates. To get X→NGN: USDNGN / USDX
      const usdToNgn = data.quotes?.["USDNGN"];
      if (!usdToNgn) throw new Error("No USD to NGN rate");

      const rates: Record<string, number> = { USD: usdToNgn };

      for (const [key, value] of Object.entries(data.quotes)) {
        const currency = key.replace("USD", "");
        if (currency === "NGN") continue;
        // Rate: 1 CURRENCY = (USDNGN / USDCURRENCY) NGN
        rates[currency] = usdToNgn / value;
      }

      // NGN itself
      rates["NGN"] = 1;

      return rates;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const convertToNgn = (
  amount: number,
  currency: string,
  rates: Record<string, number> | undefined,
  markupPercent: number = 0
): number | null => {
  if (!rates || !currency) return null;
  const rate = rates[currency.toUpperCase()];
  if (!rate) return null;
  const markedUpRate = rate * (1 + markupPercent / 100);
  return Math.round(amount * markedUpRate * 100) / 100;
};
