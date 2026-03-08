import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata, useKvdataQuery } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { EduPinsPrices } from "@/components/services/EduPinsPrices";
import { useTransactionGuard } from "@/hooks/useTransactionGuard";

const EduPins = () => {
  const navigate = useNavigate();
  const [examName, setExamName] = useState("");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [quantity, setQuantity] = useState("1");
  const [showSuccess, setShowSuccess] = useState(false);
  const [pinData, setPinData] = useState<any>(null);
  const [pinOpen, setPinOpen] = useState(false);
  
  const kvdata = useKvdata();
  const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();

  const total = useMemo(() => 
    selectedExam ? selectedExam.price * parseInt(quantity) : 0,
    [selectedExam, quantity]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    setPinOpen(true);
  };

  const handleConfirmPurchase = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if (!isValid) return false;

    if (!selectedExam) return false;

    try {
      const res = await kvdata.mutateAsync({
        action: "buy_edu_pin",
        exam_name: examName,
        quantity: parseInt(quantity),
        amount: total,
      });
      setPinData(res?.kvdata);
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
          <h1 className="text-lg font-bold text-primary-foreground">Education Pins</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Exam Type</label>
            <EduPinsPrices 
                selectedExamName={examName}
                onSelect={(exam) => {
                    setExamName(exam.name);
                    setSelectedExam(exam);
                }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Quantity</label>
            <Select value={quantity} onValueChange={setQuantity}>
              <SelectTrigger className="h-14 rounded-2xl border-2 border-border/50 focus:ring-primary/20 bg-secondary/20 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} pin{n > 1 ? "s" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedExam && (
            <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Amount</p>
                    <p className="text-xl font-black text-primary">₦{total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            variant="hero" 
            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" 
            disabled={kvdata.isPending || !examName}
          >
            {kvdata.isPending ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                </div>
            ) : "Purchase Pin"}
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
          <h2 className="text-xl font-bold">Pin Generated!</h2>
          <p className="text-sm text-muted-foreground mb-2">Your {examName} pin has been generated.</p>
          {pinData && (
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-foreground">PIN</p>
              <p className="text-lg font-mono font-bold tracking-wider">{pinData.pin || pinData.Pin || JSON.stringify(pinData)}</p>
              {(pinData.serial || pinData.Serial) && (
                <p className="text-xs text-muted-foreground mt-1">Serial: {pinData.serial || pinData.Serial}</p>
              )}
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EduPins;
