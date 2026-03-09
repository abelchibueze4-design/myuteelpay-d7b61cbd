import { useState, useEffect } from "react";
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
import { Lock, Fingerprint } from "lucide-react";
import { TransactionProcessingOverlay } from "@/components/TransactionProcessingOverlay";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";

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
  const [processing, setProcessing] = useState(false);
  
  const { isEnabled: biometricEnabled, authenticate, isLoading: biometricLoading } = useBiometricAuth();

  // Auto-trigger biometric when dialog opens
  useEffect(() => {
    if (open && biometricEnabled && !processing) {
      handleBiometricAuth();
    }
  }, [open, biometricEnabled]);

  const handleBiometricAuth = async () => {
    if (!biometricEnabled) return;
    
    setProcessing(true);
    const success = await authenticate();
    if (success) {
      // Use special token to indicate biometric success
      const verified = await onVerify("__biometric__");
      if (verified) {
        setPin("");
        setVerifyError(null);
        setProcessing(false);
        onOpenChange(false);
        return;
      }
    }
    setProcessing(false);
    setVerifyError("Biometric authentication failed. Please use your PIN.");
  };

  const handleVerify = async () => {
    if (!pin) {
      setVerifyError("Please enter your PIN");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setVerifyError("PIN must be exactly 4 digits");
      return;
    }

    setProcessing(true);
    const success = await onVerify(pin);
    if (success) {
      setPin("");
      setVerifyError(null);
      setProcessing(false);
      onOpenChange(false);
    } else {
      setProcessing(false);
      // Only show PIN-specific errors, not generic transaction failures
      if (error && error.toLowerCase().includes("pin")) {
        setVerifyError(error);
      } else if (error) {
        // Non-PIN error — close dialog and let the caller handle it
        setPin("");
        setVerifyError(null);
        onOpenChange(false);
      } else {
        setVerifyError("Incorrect PIN");
      }
    }
  };

  const handleClose = () => {
    if (processing) return;
    setPin("");
    setVerifyError(null);
    setProcessing(false);
    onOpenChange(false);
  };

  const handleInputChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 4) {
      setPin(numericValue);
      if (verifyError) setVerifyError(null);
    }
  };

  return (
    <>
      <TransactionProcessingOverlay open={processing} />

      <Dialog open={open && !processing} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Biometric button */}
            {biometricEnabled && (
              <Button
                variant="outline"
                onClick={handleBiometricAuth}
                disabled={biometricLoading || isLoading}
                className="w-full flex items-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                Use Biometrics
              </Button>
            )}

            {biometricEnabled && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or use PIN</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="pin">Transaction PIN</Label>
              <Input
                id="pin"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••"
                maxLength={4}
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
    </>
  );
};
