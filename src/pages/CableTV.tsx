import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tv, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { toast } from "sonner";

const providers = [
  { name: "DSTV", plans: [{ label: "Padi", price: 2500 }, { label: "Yanga", price: 3500 }, { label: "Confam", price: 6200 }, { label: "Compact", price: 10500 }, { label: "Premium", price: 24500 }] },
  { name: "GOTV", plans: [{ label: "Smallie", price: 1300 }, { label: "Jinja", price: 2700 }, { label: "Jolli", price: 3950 }, { label: "Max", price: 5700 }] },
  { name: "StarTimes", plans: [{ label: "Nova", price: 1200 }, { label: "Basic", price: 2600 }, { label: "Smart", price: 3800 }, { label: "Classic", price: 5500 }] },
];

const CableTV = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState("");
  const [plan, setPlan] = useState("");
  const [smartcard, setSmartcard] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const createTransaction = useCreateTransaction();

  const selectedProvider = providers.find((p) => p.name === provider);
  const selectedPlan = selectedProvider?.plans.find(p => p.label === plan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      await createTransaction.mutateAsync({
        type: "cable_tv",
        amount: selectedPlan.price,
        description: `${provider} ${selectedPlan.label} - ${smartcard}`,
        metadata: { provider, plan, smartcard },
      });
      setShowSuccess(true);
    } catch {
      toast.error("Transaction failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="gradient-hero px-4 py-6">
        <div className="container mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Cable TV</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 -mt-2">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={(v) => { setProvider(v); setPlan(""); }}>
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
              <Input value={smartcard} onChange={(e) => setSmartcard(e.target.value)} placeholder="Enter number" className="pl-10" required />
            </div>
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={createTransaction.isPending}>
            {createTransaction.isPending ? "Processing..." : "Pay Now"}
          </Button>
        </form>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Subscription Successful!</h2>
          <p className="text-sm text-muted-foreground">Your cable TV subscription has been activated.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>Download Receipt</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CableTV;
