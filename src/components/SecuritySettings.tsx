import { useState } from "react";
import { Eye, EyeOff, Lock, KeyRound, RotateCcw, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PinInput = ({ id, value, onChange, error, placeholder }: {
  id: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string;
}) => (
  <div>
    <Input
      id={id}
      type="password"
      maxLength={4}
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const val = e.target.value.replace(/\D/g, "");
        if (val.length <= 4) onChange(val);
      }}
      className={error ? "border-destructive" : ""}
      placeholder={placeholder || "Enter 4 digits"}
    />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

export const SecuritySettings = () => {
  const {
    settings,
    isLoading,
    error: hookError,
    updatePassword,
    setTransactionPin,
    removeTransactionPin,
  } = useSecuritySettings();
  const { verifyPin } = useTransactionPinVerification();
  const { user } = useAuth();
  const {
    isSupported: biometricSupported,
    isEnabled: biometricEnabled,
    isLoading: biometricLoading,
    toggleEnabled: toggleBiometric,
    remove: removeBiometric,
  } = useBiometricAuth();

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // PIN change state
  const [pinMode, setPinMode] = useState<null | "change" | "reset">(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({});

  // Reset PIN state
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetPasswordVerified, setResetPasswordVerified] = useState(false);

  // Remove PIN state
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removePassword, setRemovePassword] = useState("");
  const [showRemovePass, setShowRemovePass] = useState(false);
  const [removeErrors, setRemoveErrors] = useState<Record<string, string>>({});

  const resetPinForm = () => {
    setPinMode(null);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinVerified(false);
    setPinErrors({});
    setResetPassword("");
    setResetPasswordVerified(false);
    setShowRemoveConfirm(false);
    setRemovePassword("");
    setRemoveErrors({});
  };

  // === Password Validation ===
  const validatePasswordChange = (): boolean => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Current password is required";
    if (!newPassword) errors.newPassword = "New password is required";
    else if (newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (currentPassword === newPassword) errors.newPassword = "New password must be different from current";
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordChange()) return;
    const success = await updatePassword(currentPassword, newPassword);
    if (success) {
      toast.success("Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowPasswordChange(false);
    } else {
      toast.error("Failed to change password");
    }
  };

  // === Verify Current PIN ===
  const handleVerifyCurrentPin = async () => {
    if (!/^\d{4}$/.test(currentPin)) {
      setPinErrors({ currentPin: "Enter your current 4-digit PIN" });
      return;
    }
    const valid = await verifyPin(currentPin);
    if (valid) {
      setPinVerified(true);
      setPinErrors({});
      toast.success("Current PIN verified");
    } else {
      setPinErrors({ currentPin: "Incorrect PIN" });
    }
  };

  // === Verify Password for Reset ===
  const handleVerifyPasswordForReset = async () => {
    if (!resetPassword) {
      setPinErrors({ resetPassword: "Enter your account password" });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: resetPassword,
      });
      if (error) {
        setPinErrors({ resetPassword: "Incorrect password" });
        return;
      }
      setResetPasswordVerified(true);
      setPinErrors({});
      toast.success("Password verified. Set your new PIN.");
    } catch {
      setPinErrors({ resetPassword: "Verification failed" });
    }
  };

  // === Set New PIN ===
  const handleSetNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!newPin) errors.pin = "PIN is required";
    else if (!/^\d{4}$/.test(newPin)) errors.pin = "PIN must be exactly 4 digits";
    if (!confirmPin) errors.confirmPin = "Please confirm your PIN";
    else if (newPin !== confirmPin) errors.confirmPin = "PINs do not match";
    if (Object.keys(errors).length > 0) { setPinErrors(errors); return; }

    const success = await setTransactionPin(newPin);
    if (success) {
      toast.success(pinMode === "reset" ? "PIN reset successfully" : "PIN changed successfully");
      resetPinForm();
    } else {
      toast.error(hookError || "Failed to set PIN");
    }
  };

  const handleRemovePin = async () => {
    const success = await removeTransactionPin();
    if (success) toast.success("Transaction PIN removed");
    else toast.error("Failed to remove PIN");
  };

  // PinInput moved outside component — see below

  return (
    <div className="space-y-6">
      {/* Change Password Section */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPasswordChange(!showPasswordChange)}>
            {showPasswordChange ? "Cancel" : "Edit"}
          </Button>
        </div>

        {showPasswordChange && (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input id="currentPassword" type={showCurrentPass ? "text" : "password"} value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: "" }); }}
                  className={passwordErrors.currentPassword ? "border-destructive" : ""} placeholder="Enter current password" />
                <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && <p className="text-xs text-destructive mt-1">{passwordErrors.currentPassword}</p>}
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input id="newPassword" type={showNewPass ? "text" : "password"} value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: "" }); }}
                  className={passwordErrors.newPassword ? "border-destructive" : ""} placeholder="Enter new password" />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && <p className="text-xs text-destructive mt-1">{passwordErrors.newPassword}</p>}
              {newPassword && <PasswordStrengthIndicator password={newPassword} />}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPass ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: "" }); }}
                  className={passwordErrors.confirmPassword ? "border-destructive" : ""} placeholder="Confirm your new password" />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && <p className="text-xs text-destructive mt-1">{passwordErrors.confirmPassword}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPasswordChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? "Updating..." : "Update Password"}</Button>
            </div>
          </form>
        )}
      </div>

      {/* Transaction PIN Section */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Transaction PIN</h3>
              <p className="text-xs text-muted-foreground">
                {settings.transactionPinEnabled ? "Enabled — Required for purchases" : "Disabled — Set a PIN for security"}
              </p>
            </div>
          </div>
          {!pinMode && (
            <div className="flex gap-2">
              {!settings.transactionPinEnabled ? (
                <Button variant="outline" size="sm" onClick={() => { setPinMode("change"); setPinVerified(true); }}>
                  Set PIN
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setPinMode("change")}>
                  Change PIN
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Change PIN flow — verify current first */}
        {pinMode === "change" && settings.transactionPinEnabled && !pinVerified && (
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground">Enter your current PIN to continue</p>
            <PinInput id="currentPin" value={currentPin} onChange={(v) => { setCurrentPin(v); setPinErrors({}); }}
              error={pinErrors.currentPin} placeholder="Current 4-digit PIN" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resetPinForm}>Cancel</Button>
              <Button type="button" className="flex-1" onClick={handleVerifyCurrentPin} disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify PIN"}
              </Button>
            </div>
            <button type="button" onClick={() => { resetPinForm(); setPinMode("reset"); }}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mt-1">
              <RotateCcw className="w-3 h-3" /> Forgot PIN? Reset with password
            </button>
          </div>
        )}

        {/* Reset PIN flow — verify password */}
        {pinMode === "reset" && !resetPasswordVerified && (
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground">Enter your account password to reset PIN</p>
            <div>
              <Label htmlFor="resetPassword">Account Password</Label>
              <div className="relative">
                <Input id="resetPassword" type={showResetPass ? "text" : "password"} value={resetPassword}
                  onChange={(e) => { setResetPassword(e.target.value); setPinErrors({}); }}
                  className={pinErrors.resetPassword ? "border-destructive" : ""} placeholder="Enter your login password" />
                <button type="button" onClick={() => setShowResetPass(!showResetPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinErrors.resetPassword && <p className="text-xs text-destructive mt-1">{pinErrors.resetPassword}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resetPinForm}>Cancel</Button>
              <Button type="button" className="flex-1" onClick={handleVerifyPasswordForReset} disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Password"}
              </Button>
            </div>
          </div>
        )}

        {/* New PIN form — shown after verification */}
        {((pinMode === "change" && pinVerified) || (pinMode === "reset" && resetPasswordVerified)) && (
          <form onSubmit={handleSetNewPin} className="space-y-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground">
              {pinMode === "reset" ? "Set your new PIN" : settings.transactionPinEnabled ? "Enter your new PIN" : "Create a 4-digit PIN"}
            </p>
            <div>
              <Label htmlFor="newPin">New PIN (4 digits)</Label>
              <PinInput id="newPin" value={newPin} onChange={(v) => { setNewPin(v); if (pinErrors.pin) setPinErrors({ ...pinErrors, pin: "" }); }}
                error={pinErrors.pin} placeholder="Enter 4 digits" />
            </div>
            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <PinInput id="confirmPin" value={confirmPin} onChange={(v) => { setConfirmPin(v); if (pinErrors.confirmPin) setPinErrors({ ...pinErrors, confirmPin: "" }); }}
                error={pinErrors.confirmPin} placeholder="Confirm your 4-digit PIN" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resetPinForm}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Setting..." : pinMode === "reset" ? "Reset PIN" : "Set PIN"}
              </Button>
            </div>
          </form>
        )}

        {/* Remove PIN button */}
        {settings.transactionPinEnabled && !pinMode && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleRemovePin} disabled={isLoading}>
              Remove PIN
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPinMode("reset")}
              className="text-primary font-semibold gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Reset PIN
            </Button>
          </div>
        )}
      </div>

      {/* Biometric Authentication Section */}
      {biometricSupported && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Biometric Authentication</h3>
                <p className="text-xs text-muted-foreground">
                  Use fingerprint or face recognition for transactions
                </p>
              </div>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={async (checked) => {
                const success = await toggleBiometric(checked);
                if (success) {
                  toast.success(checked ? "Biometrics enabled" : "Biometrics disabled");
                } else {
                  toast.error("Failed to update biometric settings");
                }
              }}
              disabled={biometricLoading || !settings.transactionPinEnabled}
            />
          </div>
          {!settings.transactionPinEnabled && (
            <p className="text-xs text-muted-foreground">
              Enable Transaction PIN first to use biometric authentication
            </p>
          )}
        </div>
      )}
    </div>
  );
};
