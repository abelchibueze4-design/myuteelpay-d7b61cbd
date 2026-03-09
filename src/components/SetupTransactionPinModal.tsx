import { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { toast } from "sonner";

interface SetupTransactionPinModalProps {
  open: boolean;
  onComplete: () => void;
  isRequired?: boolean;
}

export const SetupTransactionPinModal = ({
  open,
  onComplete,
  isRequired = false,
}: SetupTransactionPinModalProps) => {
  const { setTransactionPin, isLoading, error } = useSecuritySettings();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePin = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!pin) {
      newErrors.pin = "PIN is required";
    } else if (!/^\d{4}$/.test(pin)) {
      newErrors.pin = "PIN must be exactly 4 digits";
    }

    if (!confirmPin) {
      newErrors.confirmPin = "Please confirm your PIN";
    } else if (pin !== confirmPin) {
      newErrors.confirmPin = "PINs do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetup = async () => {
    if (!validatePin()) return;

    const success = await setTransactionPin(pin);
    if (success) {
      toast.success("Transaction PIN set successfully!");
      setPin("");
      setConfirmPin("");
      setErrors({});
      onComplete();
    } else {
      toast.error(error || "Failed to set transaction PIN");
    }
  };

  const handleSkip = () => {
    if (!isRequired) {
      onComplete();
    } else {
      toast.error("Transaction PIN is required to proceed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Set Up Transaction PIN
          </DialogTitle>
          <DialogDescription>
            Create a 4-digit PIN to secure utility purchases and wallet operations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isRequired && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                A transaction PIN is required for your security. You'll need it to make any transactions.
              </p>
            </div>
          )}

          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <Label htmlFor="setup-pin">Transaction PIN (4 digits)</Label>
              <Input
                id="setup-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 4) {
                    setPin(val);
                  }
                  if (errors.pin) setErrors({ ...errors, pin: "" });
                }}
                className={errors.pin ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.pin && (
                <p className="text-xs text-destructive mt-1">{errors.pin}</p>
              )}
            </div>

            <div>
              <Label htmlFor="setup-confirm-pin">Confirm PIN</Label>
              <Input
                id="setup-confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 4) {
                    setConfirmPin(val);
                  }
                  if (errors.confirmPin) setErrors({ ...errors, confirmPin: "" });
                }}
                className={errors.confirmPin ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.confirmPin && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPin}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 border-t border-border pt-4">
            {!isRequired && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1"
              >
                Skip for Now
              </Button>
            )}
            <Button
              onClick={handleSetup}
              disabled={isLoading || !pin || !confirmPin}
              className="flex-1"
            >
              {isLoading ? "Setting..." : "Set PIN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
