import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SecuritySettings {
  transactionPinEnabled: boolean;
}

export const useSecuritySettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SecuritySettings>({
    transactionPinEnabled: false,
  });

  useEffect(() => {
    if (!user?.id) {
      setIsSettingsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("transaction_pin_enabled, transaction_pin_hash")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        const hasPinHash = !!(data as any)?.transaction_pin_hash;
        const isPinEnabled = (data as any)?.transaction_pin_enabled || false;

        setSettings({
          transactionPinEnabled: isPinEnabled && hasPinHash,
        });
      } catch (err) {
        console.error("Failed to load security settings:", err);
      } finally {
        setIsSettingsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

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

    const normalizedPin = pin.trim();
    if (!/^[0-9]{4}$/.test(normalizedPin)) {
      setError("PIN must be exactly 4 digits");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Always use the secure server-side RPC function
      const { error: rpcError } = await supabase.rpc("set_transaction_pin", {
        p_pin: normalizedPin,
      });

      if (rpcError) throw rpcError;

      setSettings((prev) => ({ ...prev, transactionPinEnabled: true }));
      return true;
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message || "Failed to set transaction PIN")
          : "Failed to set transaction PIN";
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

  return {
    settings,
    isLoading,
    isSettingsLoading,
    error,
    updatePassword,
    setTransactionPin,
    removeTransactionPin,
  };
};
