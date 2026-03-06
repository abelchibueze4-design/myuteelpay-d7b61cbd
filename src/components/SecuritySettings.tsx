import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { toast } from "sonner";

export const SecuritySettings = () => {
  const {
    settings,
    isLoading,
    error: hookError,
    updatePassword,
    setTransactionPin,
    removeTransactionPin,
    toggleTwoFA,
  } = useSecuritySettings();

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );

  // Transaction PIN state
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({});

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(settings.twoFaEnabled);

  useEffect(() => {
    setTwoFaEnabled(settings.twoFaEnabled);
  }, [settings.twoFaEnabled]);

  const validatePasswordChange = (): boolean => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (currentPassword === newPassword) {
      errors.newPassword = "New password must be different from current";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordChange()) return;

    const success = await updatePassword(currentPassword, newPassword);
    if (success) {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    } else {
      toast.error("Failed to change password");
    }
  };

  const validatePinSetup = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newPin) {
      errors.pin = "PIN is required";
    } else if (!/^\d{4}$/.test(newPin)) {
      errors.pin = "PIN must be exactly 4 digits";
    }

    if (!confirmPin) {
      errors.confirmPin = "Please confirm your PIN";
    } else if (newPin !== confirmPin) {
      errors.confirmPin = "PINs do not match";
    }

    setPinErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSetTransactionPin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePinSetup()) return;

    const success = await setTransactionPin(newPin);
    if (success) {
      toast.success("Transaction PIN set successfully");
      setNewPin("");
      setConfirmPin("");
      setShowPinSetup(false);
    } else {
      toast.error(hookError || "Failed to set transaction PIN");
    }
  };

  const handleRemoveTransactionPin = async () => {
    const success = await removeTransactionPin();
    if (success) {
      toast.success("Transaction PIN removed");
    } else {
      toast.error("Failed to remove transaction PIN");
    }
  };

  const handleToggle2FA = async () => {
    const newState = !twoFaEnabled;
    const success = await toggleTwoFA(newState);
    if (success) {
      setTwoFaEnabled(newState);
      toast.success(
        newState
          ? "Two-factor authentication enabled"
          : "Two-factor authentication disabled"
      );
    } else {
      toast.error("Failed to update 2FA settings");
    }
  };

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
              <p className="text-xs text-muted-foreground">
                Update your account password
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordChange(!showPasswordChange)}
          >
            {showPasswordChange ? "Cancel" : "Edit"}
          </Button>
        </div>

        {showPasswordChange && (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
            {/* Current Password */}
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({
                        ...passwordErrors,
                        currentPassword: "",
                      });
                    }
                  }}
                  className={passwordErrors.currentPassword ? "border-destructive" : ""}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: "" });
                    }
                  }}
                  className={passwordErrors.newPassword ? "border-destructive" : ""}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showNewPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordErrors.newPassword}
                </p>
              )}
              {newPassword && <PasswordStrengthIndicator password={newPassword} />}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({
                        ...passwordErrors,
                        confirmPassword: "",
                      });
                    }
                  }}
                  className={
                    passwordErrors.confirmPassword ? "border-destructive" : ""
                  }
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowPasswordChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Two-Factor Authentication
              </h3>
              <p className="text-xs text-muted-foreground">
                {twoFaEnabled
                  ? "Enabled - Extra security for your account"
                  : "Disabled - Enable for stronger security"}
              </p>
            </div>
          </div>
          <Switch
            checked={twoFaEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isLoading}
          />
        </div>
        {twoFaEnabled && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded p-3 text-xs text-muted-foreground">
            Your account is protected with two-factor authentication. You'll be
            required to enter a code from your authenticator app on login.
          </div>
        )}
      </div>

      {/* Transaction PIN Section */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Transaction PIN
              </h3>
              <p className="text-xs text-muted-foreground">
                {settings.transactionPinEnabled
                  ? "Enabled - Required for sensitive operations"
                  : "Disabled - Set a PIN for additional security"}
              </p>
            </div>
          </div>
          {!settings.transactionPinEnabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPinSetup(!showPinSetup)}
            >
              {showPinSetup ? "Cancel" : "Set PIN"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPinSetup(!showPinSetup)}
            >
              {showPinSetup ? "Cancel" : "Change PIN"}
            </Button>
          )}
        </div>

        {showPinSetup && (
          <form onSubmit={handleSetTransactionPin} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="newPin">New PIN (4 digits)</Label>
              <Input
                id="newPin"
                type="password"
                maxLength={4}
                inputMode="numeric"
                value={newPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 4) {
                    setNewPin(val);
                  }
                  if (pinErrors.pin) {
                    setPinErrors({ ...pinErrors, pin: "" });
                  }
                }}
                className={pinErrors.pin ? "border-destructive" : ""}
                placeholder="Enter 4 digits"
              />
              {pinErrors.pin && (
                <p className="text-xs text-destructive mt-1">{pinErrors.pin}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                maxLength={4}
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 4) {
                    setConfirmPin(val);
                  }
                  if (pinErrors.confirmPin) {
                    setPinErrors({ ...pinErrors, confirmPin: "" });
                  }
                }}
                className={pinErrors.confirmPin ? "border-destructive" : ""}
                placeholder="Confirm your 4-digit PIN"
              />
              {pinErrors.confirmPin && (
                <p className="text-xs text-destructive mt-1">
                  {pinErrors.confirmPin}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPinSetup(false);
                  setNewPin("");
                  setConfirmPin("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Setting..." : "Set PIN"}
              </Button>
            </div>
          </form>
        )}

        {settings.transactionPinEnabled && !showPinSetup && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleRemoveTransactionPin}
              disabled={isLoading}
            >
              Remove PIN
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
