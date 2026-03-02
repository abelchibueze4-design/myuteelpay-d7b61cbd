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
      // Fetch the stored PIN hash
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("transaction_pin_hash, transaction_pin_enabled")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!data?.transaction_pin_enabled) {
        setError("Transaction PIN is not enabled");
        return false;
      }

      // Hash the provided PIN the same way
      const hashedInput = Array.from(pin)
        .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 123))
        .join("");

      // Compare hashes
      if (hashedInput !== data.transaction_pin_hash) {
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
        .select("transaction_pin_enabled")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      return data?.transaction_pin_enabled ?? false;
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
