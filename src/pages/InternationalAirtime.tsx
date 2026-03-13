import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Check, Loader2, ChevronRight, RefreshCw } from "lucide-react";
import { useAllExchangeRates, convertToNgn } from "@/hooks/useExchangeRate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata, useKvdataQuery } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { useTransactionGuard } from "@/hooks/useTransactionGuard";
import { PageBackButton } from "@/components/PageBackButton";

const InternationalAirtime = () => {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [variationCode, setVariationCode] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const kvdata = useKvdata();
  const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();
  const { guardTransaction } = useTransactionGuard();
  const { data: exchangeRates, isLoading: loadingRates, refetch: refetchRates } = useAllExchangeRates();

  // Step 1: Countries
  const { data: countries, isLoading: loadingCountries } = useKvdataQuery(
    { action: "get_intl_countries" },
    true
  );

  // Step 2: Product types for selected country
  const { data: productTypes, isLoading: loadingTypes } = useKvdataQuery(
    { action: "get_intl_product_types", country_code: countryCode },
    !!countryCode
  );

  // Step 3: Operators
  const { data: operators, isLoading: loadingOperators } = useKvdataQuery(
    { action: "get_intl_operators", country_code: countryCode, product_type_id: productTypeId },
    !!countryCode && !!productTypeId
  );

  // Step 4: Variations
  const { data: variations, isLoading: loadingVariations } = useKvdataQuery(
    { action: "get_intl_variations", operator_id: operatorId, product_type_id: productTypeId },
    !!operatorId && !!productTypeId
  );

  const countriesList = Array.isArray(countries) ? countries : [];
  const productTypesList = Array.isArray(productTypes) ? productTypes : [];
  const operatorsList = Array.isArray(operators) ? operators : [];
  const variationsList = Array.isArray(variations) ? variations : [];

  const selectedCountry = countriesList.find((c: any) => c.code === countryCode);
  
  // Detect the currency from the selected country or variation
  const detectedCurrency = useMemo(() => {
    if (selectedVariation?.currency) return selectedVariation.currency;
    if (selectedCountry?.currency) return selectedCountry.currency;
    return "USD"; // fallback
  }, [selectedVariation, selectedCountry]);

  const totalAmount = selectedVariation
    ? Number(selectedVariation.variation_amount) || Number(amount) || 0
    : Number(amount) || 0;

  const ngnEquivalent = useMemo(() => {
    if (totalAmount <= 0 || !exchangeRates) return null;
    // If already NGN, no conversion needed
    if (detectedCurrency === "NGN") return totalAmount;
    return convertToNgn(totalAmount, detectedCurrency, exchangeRates);
  }, [totalAmount, detectedCurrency, exchangeRates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variationCode || !phone || totalAmount <= 0) return;
    const { allowed } = guardTransaction(totalAmount);
    if (!allowed) return;
    setPinOpen(true);
  };

  const handleConfirmPurchase = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if (!isValid) return false;

    try {
      await kvdata.mutateAsync({
        action: "buy_intl_airtime",
        variation_code: variationCode,
        phone,
        amount: totalAmount,
        operator_id: operatorId,
        country_code: countryCode,
        product_type_id: productTypeId,
        country_name: selectedCountry?.name || "",
      });
      setShowSuccess(true);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-secondary pb-12">
      <div className="gradient-hero px-4 py-6 mb-6">
        <div className="container mx-auto flex items-center gap-3">
          <PageBackButton />
          <h1 className="text-lg font-bold text-primary-foreground">International Airtime</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
          {/* Step 1: Country */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
              Select Country
            </label>
            {loadingCountries ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {countriesList.map((c: any) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountryCode(c.code);
                      setProductTypeId("");
                      setOperatorId("");
                      setVariationCode("");
                      setSelectedVariation(null);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center ${
                      countryCode === c.code
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <img src={c.flag} alt={c.name} className="w-8 h-6 object-cover rounded" />
                    <span className="text-[10px] font-bold">{c.name}</span>
                    <span className="text-[9px] text-muted-foreground">+{c.prefix}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Product Type */}
          {countryCode && (
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Product Type
              </label>
              {loadingTypes ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {productTypesList.map((pt: any) => (
                    <button
                      key={pt.product_type_id}
                      type="button"
                      onClick={() => {
                        setProductTypeId(String(pt.product_type_id));
                        setOperatorId("");
                        setVariationCode("");
                        setSelectedVariation(null);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                        productTypeId === String(pt.product_type_id)
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      {pt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Operator */}
          {productTypeId && (
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Operator
              </label>
              {loadingOperators ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {operatorsList.map((op: any) => (
                    <button
                      key={op.operator_id}
                      type="button"
                      onClick={() => {
                        setOperatorId(String(op.operator_id));
                        setVariationCode("");
                        setSelectedVariation(null);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                        operatorId === String(op.operator_id)
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      {op.operator_image && (
                        <img src={op.operator_image} alt={op.name} className="w-8 h-8 rounded-lg object-contain" />
                      )}
                      <span className="text-xs font-bold">{op.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Variation / Plan */}
          {operatorId && (
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Select Plan
              </label>
              {loadingVariations ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {variationsList.map((v: any) => (
                    <button
                      key={v.variation_code}
                      type="button"
                      onClick={() => {
                        setVariationCode(v.variation_code);
                        setSelectedVariation(v);
                        if (Number(v.variation_amount) > 0) {
                          setAmount(String(v.variation_amount));
                        }
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        variationCode === v.variation_code
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <p className="text-xs font-bold break-words">{v.name}</p>
                      {Number(v.variation_amount) > 0 && (
                        <p className="text-xs text-primary font-black mt-1">₦{Number(v.variation_amount).toLocaleString()}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Phone Number */}
          {variationCode && (
            <>
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={`+${selectedCountry?.prefix || ""}XXXXXXXXX`}
                    className="h-14 rounded-2xl border-2 border-border/50 pl-12 focus-visible:ring-primary/20 bg-secondary/20 font-bold placeholder:text-[10px] placeholder:font-normal"
                    type="tel"
                    required
                  />
                </div>
              </div>

              {(!selectedVariation?.variation_amount || Number(selectedVariation.variation_amount) === 0) && (
                <div className="space-y-3">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Amount</label>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="h-14 rounded-2xl border-2 border-border/50 px-6 focus-visible:ring-primary/20 bg-secondary/20 text-xl font-black placeholder:text-[10px] placeholder:font-normal"
                    type="number"
                    required
                  />
                </div>
              )}

              {totalAmount > 0 && (
                <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</p>
                      <p className="text-xl font-black text-primary">₦{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            variant="hero"
            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
            disabled={kvdata.isPending || !variationCode || !phone}
          >
            {kvdata.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            ) : (
              "Purchase"
            )}
          </Button>
        </form>
      </div>

      <PinVerificationDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        onVerify={handleConfirmPurchase}
        isLoading={isVerifying || kvdata.isPending}
      />

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Purchase Successful!</h2>
          <p className="text-sm text-muted-foreground">
            International airtime has been sent to {phone}.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternationalAirtime;
