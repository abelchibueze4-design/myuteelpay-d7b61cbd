import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tv, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

const providers = [
  { name: "DSTV", plans: [{ label: "Padi", plan_id: 1, price: 2500 }, { label: "Yanga", plan_id: 2, price: 3500 }, { label: "Confam", plan_id: 3, price: 6200 }, { label: "Compact", plan_id: 4, price: 10500 }, { label: "Premium", plan_id: 5, price: 24500 }] },
  { name: "GOTV", plans: [{ label: "Smallie", plan_id: 1, price: 1300 }, { label: "Jinja", plan_id: 2, price: 2700 }, { label: "Jolli", plan_id: 3, price: 3950 }, { label: "Max", plan_id: 4, price: 5700 }] },
  { name: "StarTimes", plans: [{ label: "Nova", plan_id: 1, price: 1200 }, { label: "Basic", plan_id: 2, price: 2600 }, { label: "Smart", plan_id: 3, price: 3800 }, { label: "Classic", plan_id: 4, price: 5500 }] },
];

const CableTV = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState("");
  const [plan, setPlan] = useState("");
  const [smartcard, setSmartcard] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const kvdata = useKvdata();
  const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();

  const selectedProvider = providers.find((p) => p.name === provider);
  const selectedPlan = selectedProvider?.plans.find(p => p.label === plan);

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
    if (!selectedPlan) return;
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
    <div className="min-h-screen bg-secondary">
      <div className="gradient-hero px-4 py-6">
        <div className="container mx-auto">
          <h1 className="text-lg font-bold text-primary-foreground">Cable TV</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-2">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={(v) => { setProvider(v); setPlan(""); setCustomerName(""); }}>
              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>{providers.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedProvider && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>{selectedProvider.plans.map((p) => <SelectItem key={p.label} value={p.label}>{p.label} ₦{p.price.toLocaleString()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Smartcard / IUC Number</label>
            <div className="relative">
              <Tv className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={smartcard} onChange={(e) => { setSmartcard(e.target.value); setCustomerName(""); }} placeholder="Enter number" className="pl-10" required onBlur={handleValidateIUC} />
            </div>
            {customerName && <p className="text-xs text-primary font-medium">✓ {customerName}</p>}
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
