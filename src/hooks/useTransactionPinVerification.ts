import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTransactionPinVerification = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPin = async (pin: string): Promise<boolean> => {
    // Biometric bypass — already verified by WebAuthn
    if (pin === "__biometric__") {
      return true;
    }

    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Always use server-side RPC for verification
      const { data, error: rpcError } = await supabase.rpc("verify_transaction_pin", {
        p_pin: pin,
      });

      if (rpcError) {
        console.error("PIN verification RPC error:", rpcError);
        setError("Failed to verify PIN. Please try again.");
        return false;
      }

      if (data === false) {
        setError("Incorrect PIN");
        return false;
      }

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to verify PIN";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfPinRequired = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("transaction_pin_enabled, transaction_pin_hash")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      
      // PIN is required only if both enabled AND hash exists
      const pinEnabled = (data as any)?.transaction_pin_enabled ?? false;
      const pinHash = (data as any)?.transaction_pin_hash;
      return pinEnabled && !!pinHash;
    } catch (err) {
      console.error("Error checking PIN requirement:", err);
      return false;
    }
  };

  return { verifyPin, checkIfPinRequired, isLoading, error };
};
