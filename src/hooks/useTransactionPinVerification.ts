import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTransactionPinVerification = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the new RPC function for secure server-side verification
      const { data, error: rpcError } = await supabase.rpc("verify_transaction_pin", {
        p_pin: pin,
      });

      if (rpcError) throw rpcError;

      if (data === false) {
        setError("Incorrect PIN or PIN not enabled");
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

  return { verifyPin, isLoading, error };
};

  const checkIfPinRequired = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("transaction_pin_enabled" as any)
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      return (data as any)?.transaction_pin_enabled ?? false;
    } catch (err) {
      console.error("Error checking PIN requirement:", err);
      return false;
    }
  };

  return {
    verifyPin,
    checkIfPinRequired,
    isLoading,
    error,
  };
};
