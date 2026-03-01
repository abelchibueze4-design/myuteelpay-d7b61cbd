import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const discos = ["IKEDC", "EKEDC", "AEDC", "KEDCO", "PHEDC", "BEDC", "IBEDC", "JEDC", "KAEDCO"];

const Electricity = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<"prepaid" | "postpaid">("prepaid");
  const [disco, setDisco] = useState("");
  const [meter, setMeter] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="min-h-screen bg-secondary">
      <header className="gradient-hero px-4 py-6">
        <div className="container mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Electricity</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 -mt-2">
        <div className="flex gap-2 mb-6">
          {(["prepaid", "postpaid"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                type === t ? "gradient-primary text-primary-foreground shadow-primary" : "bg-card text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setShowSuccess(true); }} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Distribution Company</label>
            <Select value={disco} onValueChange={setDisco}>
              <SelectTrigger><SelectValue placeholder="Select disco" /></SelectTrigger>
              <SelectContent>
                {discos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Meter Number</label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={meter} onChange={(e) => setMeter(e.target.value)} placeholder="Enter meter number" className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦500 minimum" type="number" required />
          </div>

          <Button type="submit" variant="hero" className="w-full">Pay Now</Button>
        </form>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Payment Successful!</h2>
          <p className="text-sm text-muted-foreground">Your electricity token has been generated.</p>
          <div className="bg-secondary rounded-lg p-3 my-3">
            <p className="text-xs text-muted-foreground">Token</p>
            <p className="text-lg font-mono font-bold tracking-wider">1234-5678-9012-3456</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>Download Receipt</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Electricity;
