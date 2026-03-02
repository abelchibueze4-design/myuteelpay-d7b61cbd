import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface PinVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (pin: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}

export const PinVerificationDialog = ({
  open,
  onOpenChange,
  onVerify,
  isLoading = false,
  error = null,
  title = "Verify Transaction PIN",
  description = "Enter your transaction PIN to proceed",
}: PinVerificationDialogProps) => {
  const [pin, setPin] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!pin) {
      setVerifyError("Please enter your PIN");
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setVerifyError("PIN must be 4-6 digits");
      return;
    }

    const success = await onVerify(pin);
    if (success) {
      setPin("");
      setVerifyError(null);
      onOpenChange(false);
    } else {
      setVerifyError(error || "Incorrect PIN");
    }
  };

  const handleClose = () => {
    setPin("");
    setVerifyError(null);
    onOpenChange(false);
  };

  const handleInputChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 6) {
      setPin(numericValue);
      if (verifyError) setVerifyError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div>
            <Label htmlFor="pin">Transaction PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              placeholder="••••"
              maxLength={6}
              value={pin}
              onChange={(e) => handleInputChange(e.target.value)}
              className={verifyError ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {verifyError && (
              <p className="text-xs text-destructive mt-1">{verifyError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isLoading || !pin}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
