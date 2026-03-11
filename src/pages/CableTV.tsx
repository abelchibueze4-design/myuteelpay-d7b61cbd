import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tv, Check, Loader2 } from "lucide-react";
import { CableIcon } from "@/components/CableIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { CableTVPrices } from "@/components/services/CableTVPrices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTransactionGuard } from "@/hooks/useTransactionGuard";
import { PageBackButton } from "@/components/PageBackButton";

const CableTV = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<{ cable_id: number; cable_name: string } | null>(null);
  const [planId, setPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [smartcard, setSmartcard] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const kvdata = useKvdata();
  const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();
  const { guardTransaction } = useTransactionGuard();

  const { data: providers } = useQuery({
    queryKey: ["cables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cables").select("*");
      if (error) throw error;
      return data;
    }
  });

  // Auto-validate IUC when smartcard number reaches valid length
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCustomerName("");
    setCustomerAddress("");
    if (!smartcard || smartcard.length < 10 || !provider) return;
    setIsValidating(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await kvdata.mutateAsync({
          action: "validate_iuc",
          smart_card_number: smartcard,
          cablename: provider.cable_id,
          cable_name: provider.cable_name
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
  }, [smartcard, provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !smartcard) return;
    const { allowed } = guardTransaction(selectedPlan?.price || 0);
    if (!allowed) return;
    setPinOpen(true);
  };

  const handleConfirmPurchase = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if (!isValid) return false;
    if (!selectedPlan || !provider) return false;

    try {
      // Use the plan's own cable_name to prevent serviceID mismatch
      const planCableName = selectedPlan?.raw?.cable_name || provider.cable_name;
      await kvdata.mutateAsync({
        action: "buy_cable",
        cable_id: provider.cable_id,
        cable_name: planCableName,
        cableplan_id: selectedPlan.plan_id,
        plan_label: `${planCableName} ${selectedPlan.label}`,
        smart_card_number: smartcard,
        amount: selectedPlan.price,
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
          <h1 className="text-lg font-bold text-primary-foreground">Cable TV</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Provider</label>
            <div className="grid grid-cols-4 gap-2">
                {providers?.map((p) => (
                    <button
                        key={p.cable_id}
                        type="button"
                        onClick={() => { setProvider(p); setPlanId(""); setSelectedPlan(null); setCustomerName(""); setCustomerAddress(""); }}
                        className={`py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                            provider?.cable_id === p.cable_id 
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                            : "border-border/50 hover:border-primary/30"
                        }`}
                    >
                        <CableIcon cableName={p.cable_name} />
                        <span className="text-[10px] font-bold uppercase">{p.cable_name}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Smartcard Number */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Smartcard / IUC Number</label>
            <div className="relative">
              <Tv className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={smartcard} 
                onChange={(e) => { setSmartcard(e.target.value); }} 
                placeholder="Enter number" 
                className="h-14 rounded-2xl border-2 border-border/50 pl-12 focus-visible:ring-primary/20 bg-secondary/20 font-bold placeholder:text-[10px] placeholder:font-normal" 
                required 
              />
            </div>
            {isValidating && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Validating...</p>}
            {customerName && (
              <div className="animate-fade-in space-y-0.5">
                <p className="text-xs text-primary font-medium">✓ {customerName}</p>
                {customerAddress && <p className="text-[11px] text-muted-foreground">{customerAddress}</p>}
              </div>
            )}
          </div>

          {/* Plan Selection */}
          {provider && (
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Choose Package</label>
              <CableTVPrices 
                cableId={provider.cable_id} 
                selectedPlanId={planId}
                onSelect={(plan) => {
                    setPlanId(plan.plan_id);
                    setSelectedPlan(plan);
                }} 
              />
            </div>
          )}

          <Button 
            type="submit" 
            variant="hero" 
            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" 
            disabled={kvdata.isPending || !planId || !smartcard}
          >
            {kvdata.isPending ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                </div>
            ) : "Pay Now"}
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
          <h2 className="text-xl font-bold">Subscription Successful!</h2>
          <p className="text-sm text-muted-foreground">Your cable TV subscription has been activated.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CableTV;
