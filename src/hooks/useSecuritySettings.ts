import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SecuritySettings {
  twoFaEnabled: boolean;
  transactionPinEnabled: boolean;
}

export const useSecuritySettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFaEnabled: false,
    transactionPinEnabled: false,
  });

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!user) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would require backend validation in a real scenario
      // Supabase doesn't allow direct password verification on client side
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update password";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setTransactionPin = async (pin: string): Promise<boolean> => {
    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the secure RPC function to set the PIN in Supabase
      const { error: rpcError } = await supabase.rpc("set_transaction_pin", {
        p_pin: pin,
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        throw rpcError;
      }

      setSettings((prev) => ({ ...prev, transactionPinEnabled: true }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to set transaction PIN";
      console.error("PIN setup error:", err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTransactionPin = async (): Promise<boolean> => {
    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          transaction_pin_enabled: false,
          transaction_pin_hash: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSettings((prev) => ({ ...prev, transactionPinEnabled: false }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove transaction PIN";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTwoFA = async (enabled: boolean): Promise<boolean> => {
    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          two_fa_enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSettings((prev) => ({ ...prev, twoFaEnabled: enabled }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update 2FA settings";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    isLoading,
    error,
    updatePassword,
    setTransactionPin,
    removeTransactionPin,
    toggleTwoFA,
  };
};
