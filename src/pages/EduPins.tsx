import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { toast } from "sonner";

const exams = [
  { name: "WAEC", price: 3500 },
  { name: "NECO", price: 1800 },
];

const EduPins = () => {
  const navigate = useNavigate();
  const [exam, setExam] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [showSuccess, setShowSuccess] = useState(false);
  const createTransaction = useCreateTransaction();

  const selected = exams.find((e) => e.name === exam);
  const total = selected ? selected.price * parseInt(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await createTransaction.mutateAsync({
        type: "edu_pin",
        amount: total,
        description: `${exam} Pin x${quantity}`,
        metadata: { exam, quantity: parseInt(quantity) },
      });
      setShowSuccess(true);
    } catch {
      toast.error("Transaction failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="gradient-hero px-4 py-6">
        <div className="container mx-auto">
          <h1 className="text-lg font-bold text-primary-foreground">Education Pins</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-2">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Exam Type</label>
            <Select value={exam} onValueChange={setExam}>
              <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>{exams.map((e) => <SelectItem key={e.name} value={e.name}>{e.name} — ₦{e.price.toLocaleString()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Select value={quantity} onValueChange={setQuantity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} pin{n > 1 ? "s" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selected && (
            <div className="bg-secondary rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-gradient">₦{total.toLocaleString()}</span></div>
            </div>
          )}
          <Button type="submit" variant="hero" className="w-full" disabled={createTransaction.isPending}>
            {createTransaction.isPending ? "Processing..." : "Purchase Pin"}
          </Button>
        </form>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Pin Generated!</h2>
          <p className="text-sm text-muted-foreground mb-2">Your {exam} pin has been generated.</p>
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground">PIN</p>
            <p className="text-lg font-mono font-bold tracking-wider">WAEC-8374-2947-1038</p>
            <p className="text-xs text-muted-foreground mt-1">Serial: WRN-2026-0384756</p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>Download Receipt</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EduPins;
