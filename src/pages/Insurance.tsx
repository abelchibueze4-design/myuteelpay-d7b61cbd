import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata, useKvdataQuery } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { useTransactionGuard } from "@/hooks/useTransactionGuard";
import { PageBackButton } from "@/components/PageBackButton";

const Insurance = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [insuredName, setInsuredName] = useState("");
  const [phone, setPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const kvdata = useKvdata();
  const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();
  const { guardTransaction } = useTransactionGuard();

  const { data: plansData, isLoading: loadingPlans } = useKvdataQuery(
    { action: "get_insurance_plans" },
    true
  );

  const plans = useMemo(() => {
    if (!plansData) return [];
    const arr = plansData.plans || (Array.isArray(plansData) ? plansData : []);
    return arr;
  }, [plansData]);

  const isMotorInsurance = selectedPlan?.serviceID === "ui-insure";
  const totalAmount = selectedPlan ? Number(selectedPlan.amount) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || totalAmount <= 0) return;
    const { allowed } = guardTransaction(totalAmount);
    if (!allowed) return;
    setPinOpen(true);
  };

  const handleConfirmPurchase = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if (!isValid) return false;

    try {
      await kvdata.mutateAsync({
        action: "buy_insurance",
        serviceID: selectedPlan.serviceID,
        variation_code: selectedPlan.id,
        amount: totalAmount,
        phone,
        plan_name: selectedPlan.name,
        insured_name: insuredName,
        plate_number: plateNumber,
        engine_number: engineNumber,
        chassis_number: chassisNumber,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_color: vehicleColor,
        contact_address: contactAddress,
      });
      setShowSuccess(true);
      return true;
    } catch {
      return false;
    }
  };

  // Group plans by service
  const motorPlans = plans.filter((p: any) => p.serviceID === "ui-insure");
  const accidentPlans = plans.filter((p: any) => p.serviceID === "personal-accident-insurance");

  return (
    <div className="min-h-screen bg-secondary pb-12">
      <div className="gradient-hero px-4 py-6 mb-6">
        <div className="container mx-auto flex items-center gap-3">
          <PageBackButton />
          <h1 className="text-lg font-bold text-primary-foreground">Insurance</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
          {/* Plan Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
              Select Insurance Plan
            </label>
            {loadingPlans ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-4">
                {motorPlans.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">🚗 Motor Insurance</p>
                    <div className="grid grid-cols-2 gap-2">
                      {motorPlans.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlan(p)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            selectedPlan?.id === p.id
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                        >
                          <p className="text-xs font-bold break-words">{p.name}</p>
                          <p className="text-xs text-primary font-black mt-1">₦{Number(p.amount).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {accidentPlans.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">🛡️ Personal Accident Insurance</p>
                    <div className="grid grid-cols-2 gap-2">
                      {accidentPlans.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlan(p)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            selectedPlan?.id === p.id
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                        >
                          <p className="text-xs font-bold break-words">{p.name}</p>
                          <p className="text-xs text-primary font-black mt-1">₦{Number(p.amount).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Fields */}
          {selectedPlan && (
            <>
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Insured Name</label>
                <Input value={insuredName} onChange={(e) => setInsuredName(e.target.value)} placeholder="Full name" className="h-12 rounded-xl placeholder:text-[10px]" required />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Phone Number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08XXXXXXXXX" type="tel" className="h-12 rounded-xl placeholder:text-[10px]" required />
              </div>

              {isMotorInsurance && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Plate Number</label>
                      <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="ABC-123XY" className="h-11 rounded-xl placeholder:text-[10px]" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Engine Number</label>
                      <Input value={engineNumber} onChange={(e) => setEngineNumber(e.target.value)} placeholder="Engine No." className="h-11 rounded-xl placeholder:text-[10px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Chassis Number</label>
                      <Input value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value)} placeholder="Chassis No." className="h-11 rounded-xl placeholder:text-[10px]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Vehicle Make</label>
                      <Input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="e.g. Toyota" className="h-11 rounded-xl placeholder:text-[10px]" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Vehicle Model</label>
                      <Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="e.g. Camry" className="h-11 rounded-xl placeholder:text-[10px]" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Vehicle Color</label>
                      <Input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="e.g. Silver" className="h-11 rounded-xl placeholder:text-[10px]" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Contact Address</label>
                    <Input value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} placeholder="Your address" className="h-11 rounded-xl placeholder:text-[10px]" required />
                  </div>
                </>
              )}

              {totalAmount > 0 && (
                <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</p>
                    <p className="text-xl font-black text-primary">₦{totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            variant="hero"
            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
            disabled={kvdata.isPending || !selectedPlan || !insuredName || !phone}
          >
            {kvdata.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            ) : (
              "Purchase Insurance"
            )}
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
          <h2 className="text-xl font-bold">Insurance Purchased!</h2>
          <p className="text-sm text-muted-foreground">Your insurance policy has been processed.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Insurance;
