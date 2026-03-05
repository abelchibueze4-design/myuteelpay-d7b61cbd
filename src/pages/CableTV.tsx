import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tv, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata, useKvdataQuery } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { CableTVPrices } from "@/components/services/CableTVPrices";

const providers = [
  { name: "DSTV", id: 1 },
  { name: "GOTV", id: 2 },
  { name: "StarTimes", id: 3 }
];

const CableTV = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState("");
  const [planId, setPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [smartcard, setSmartcard] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  
  const kvdata = useKvdata();
  const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();

  const selectedProvider = providers.find((p) => p.name === provider);
  
  const handleValidateIUC = async () => {
    if (!smartcard || !provider) return;
    try {
      const res = await kvdata.mutateAsync({
        action: "validate_iuc",
        smart_card_number: smartcard,
        cablename: provider,
      });
      setCustomerName(res?.Customer_Name || res?.name || "Validated");
    } catch {
      setCustomerName("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !smartcard) return;
    setPinOpen(true);
  };

  const handleConfirmPurchase = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if (!isValid) return false;

    if (!selectedPlan) return false;

    try {
      await kvdata.mutateAsync({
        action: "buy_cable",
        cablename: provider,
        cableplan_id: selectedPlan.plan_id,
        plan_label: `${provider} ${selectedPlan.label}`,
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
        <div className="container mx-auto">
          <h1 className="text-lg font-bold text-primary-foreground">Cable TV</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Provider</label>
            <div className="grid grid-cols-3 gap-3">
                {providers.map((p) => (
                    <button
                        key={p.name}
                        type="button"
                        onClick={() => { setProvider(p.name); setPlanId(""); setSelectedPlan(null); setCustomerName(""); }}
                        className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                            provider === p.name 
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                            : "border-border/50 hover:border-primary/30"
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black bg-secondary text-primary`}>
                            {p.name[0]}
                        </div>
                        <span className="text-[10px] font-bold uppercase">{p.name}</span>
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
                onChange={(e) => { setSmartcard(e.target.value); setCustomerName(""); }} 
                placeholder="Enter number" 
                className="h-14 rounded-2xl border-2 border-border/50 pl-12 focus-visible:ring-primary/20 bg-secondary/20 font-bold" 
                required 
                onBlur={handleValidateIUC} 
              />
            </div>
            {customerName && <p className="text-xs text-primary font-medium animate-fade-in">✓ {customerName}</p>}
          </div>

          {/* Plan Selection */}
          {selectedProvider && (
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Choose Package</label>
              <CableTVPrices 
                providerId={selectedProvider.id} 
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
