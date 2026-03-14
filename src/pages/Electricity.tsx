import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Check, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiscoIcon } from "@/components/DiscoIcon";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTransactionGuard } from "@/hooks/useTransactionGuard";
import { PageBackButton } from "@/components/PageBackButton";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { applyMarkup } from "@/lib/applyMarkup";

const Electricity = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<"prepaid" | "postpaid">("prepaid");
  const [disco, setDisco] = useState("");
  const [meter, setMeter] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [discoDropdownOpen, setDiscoDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const kvdata = useKvdata();
  const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();
  const { guardTransaction } = useTransactionGuard();
  const { settings } = usePlatformSettings();
  const markup = settings.electricity_markup || 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDiscoDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: discos, isLoading: isLoadingDiscos } = useQuery({
    queryKey: ["electricity_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("electricity_companies").select("*");
      if (error) throw error;
      return data;
    }
  });

  // Auto-validate meter when number reaches valid length
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCustomerName("");
    setCustomerAddress("");
    if (!meter || meter.length < 10 || !disco) return;
    setIsValidating(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const selectedDisco = discos?.find(d => String(d.disco_id) === disco);
        const res = await kvdata.mutateAsync({
          action: "validate_meter",
          meter_number: meter,
          disco_id: Number(disco),
          meter_type: type,
          disco_label: selectedDisco?.disco_name
        });
        setCustomerName(res?.Customer_Name || res?.name || "Validated");
        setCustomerAddress(res?.Address || res?.address || "");
      } catch {
        setCustomerName("");
        setCustomerAddress("");
      } finally {
        setIsValidating(false);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [meter, disco, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disco || !meter || !amount) return;
    const chargeAmount = applyMarkup(Number(amount), markup);
    const { allowed } = guardTransaction(chargeAmount);
    if (!allowed) return;
    setPinOpen(true);
  };

  const handleConfirmPurchase = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if (!isValid) return false;

    const chargeAmount = applyMarkup(Number(amount), markup);

    try {
      const selectedDisco = discos?.find(d => String(d.disco_id) === disco);
      const res = await kvdata.mutateAsync({
        action: "buy_electricity",
        disco_id: Number(disco),
        meter_number: meter,
        meter_type: type,
        amount: chargeAmount,
        disco_label: selectedDisco?.disco_name
      });
      setToken(res?.kvdata?.token || res?.kvdata?.Token || "");
      setShowSuccess(true);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="gradient-hero px-4 py-6">
        <div className="container mx-auto flex items-center gap-3">
          <PageBackButton />
          <h1 className="text-lg font-bold text-primary-foreground">Electricity</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-2">
        <div className="flex gap-2 mb-6">
          {(["prepaid", "postpaid"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${type === t ? "gradient-primary text-primary-foreground shadow-primary" : "bg-card text-muted-foreground"
                }`}>{t}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Distribution Company</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDiscoDropdownOpen(!discoDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/30"
              >
                {disco && discos ? (
                  <div className="flex items-center gap-3">
                    <DiscoIcon discoName={discos.find(d => String(d.disco_id) === disco)?.disco_name || ""} />
                    <span className="text-sm font-medium">{discos.find(d => String(d.disco_id) === disco)?.disco_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Select distribution company</span>
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${discoDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {discoDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {isLoadingDiscos ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    discos?.map((d) => (
                      <button
                        key={d.disco_id}
                        type="button"
                        onClick={() => { setDisco(String(d.disco_id)); setCustomerName(""); setDiscoDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 transition-all hover:bg-primary/5 ${
                          disco === String(d.disco_id) ? "bg-primary/5" : ""
                        } first:rounded-t-xl last:rounded-b-xl`}
                      >
                        <DiscoIcon discoName={d.disco_name} />
                        <span className="text-sm font-medium">{d.disco_name}</span>
                        {disco === String(d.disco_id) && <Check className="w-4 h-4 text-primary ml-auto" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Meter Number</label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={meter} onChange={(e) => { setMeter(e.target.value); }} placeholder="Enter meter number" className="pl-10 placeholder:text-[10px] placeholder:font-normal" required />
            </div>
            {isValidating && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Validating...</p>}
            {customerName && (
              <div className="animate-fade-in space-y-0.5">
                <p className="text-xs text-primary font-medium">✓ {customerName}</p>
                {customerAddress && <p className="text-[11px] text-muted-foreground">{customerAddress}</p>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦500 minimum" type="number" required className="placeholder:text-[10px] placeholder:font-normal" />
            {markup > 0 && amount && (
              <p className="text-xs text-muted-foreground">
                You'll be charged <span className="font-bold text-primary">₦{applyMarkup(Number(amount), markup).toLocaleString()}</span> ({markup}% service fee included)
              </p>
            )}
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={kvdata.isPending}>
            {kvdata.isPending ? "Processing..." : "Pay Now"}
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
          <h2 className="text-xl font-bold">Payment Successful!</h2>
          <p className="text-sm text-muted-foreground">Your electricity token has been generated.</p>
          {token && (
            <div className="bg-secondary rounded-lg p-3 my-3">
              <p className="text-xs text-muted-foreground">Token</p>
              <p className="text-lg font-mono font-bold tracking-wider">{token}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Electricity;
