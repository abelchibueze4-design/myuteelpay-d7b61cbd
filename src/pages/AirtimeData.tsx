import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata } from "@/hooks/useKvdata";
import { toast } from "sonner";

const networks = ["MTN", "Glo", "Airtel", "9mobile"];
const dataPlans = [
  { label: "1GB - 30 days", plan_id: 1, price: 500 },
  { label: "2GB - 30 days", plan_id: 2, price: 1000 },
  { label: "5GB - 30 days", plan_id: 3, price: 2000 },
  { label: "10GB - 30 days", plan_id: 4, price: 3500 },
];

const AirtimeData = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"airtime" | "data">("airtime");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [plan, setPlan] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const kvdata = useKvdata();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!network || !phone) return;

    try {
      if (tab === "airtime") {
        if (!amount) return;
        await kvdata.mutateAsync({
          action: "buy_airtime",
          network,
          phone,
          amount: Number(amount),
        });
      } else {
        const selectedPlan = dataPlans.find((p) => String(p.plan_id) === plan);
        if (!selectedPlan) return;
        await kvdata.mutateAsync({
          action: "buy_data",
          network,
          phone,
          plan_id: selectedPlan.plan_id,
          plan_label: selectedPlan.label,
          amount: selectedPlan.price,
        });
      }
      setShowSuccess(true);
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="gradient-hero px-4 py-6">
        <div className="container mx-auto">
          <h1 className="text-lg font-bold text-primary-foreground">Airtime & Data</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-2">
        <div className="flex gap-2 mb-6">
          {(["airtime", "data"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? "gradient-primary text-primary-foreground shadow-primary" : "bg-card text-muted-foreground"
              }`}>{t === "airtime" ? "Airtime" : "Data"}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Network</label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
              <SelectContent>{networks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080X XXX XXXX" className="pl-10" type="tel" required />
            </div>
          </div>
          {tab === "airtime" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦100 - ₦50,000" type="number" required />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Plan</label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>{dataPlans.map((p) => <SelectItem key={p.plan_id} value={String(p.plan_id)}>{p.label} — ₦{p.price.toLocaleString()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" variant="hero" className="w-full" disabled={kvdata.isPending}>
            {kvdata.isPending ? "Processing..." : "Pay Now"}
          </Button>
        </form>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Transaction Successful!</h2>
          <p className="text-sm text-muted-foreground">Your {tab} purchase was completed successfully.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AirtimeData;
