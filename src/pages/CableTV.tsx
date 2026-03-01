import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tv, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const providers = [
  { name: "DSTV", plans: ["Padi ₦2,500", "Yanga ₦3,500", "Confam ₦6,200", "Compact ₦10,500", "Premium ₦24,500"] },
  { name: "GOTV", plans: ["Smallie ₦1,300", "Jinja ₦2,700", "Jolli ₦3,950", "Max ₦5,700"] },
  { name: "StarTimes", plans: ["Nova ₦1,200", "Basic ₦2,600", "Smart ₦3,800", "Classic ₦5,500"] },
];

const CableTV = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState("");
  const [plan, setPlan] = useState("");
  const [smartcard, setSmartcard] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedProvider = providers.find((p) => p.name === provider);

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
        <form onSubmit={(e) => { e.preventDefault(); setShowSuccess(true); }} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={(v) => { setProvider(v); setPlan(""); }}>
              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>
                {providers.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedProvider && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {selectedProvider.plans.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
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

          <Button type="submit" variant="hero" className="w-full">Pay Now</Button>
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
