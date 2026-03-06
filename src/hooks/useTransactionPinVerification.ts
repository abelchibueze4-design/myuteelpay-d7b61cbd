import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

const sha256Hex = async (value: string): Promise<string> => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(new Uint8Array(digest));
};

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
      const { data, error: rpcError } = await supabase.rpc("verify_transaction_pin", {
        p_pin: pin,
      });

      if (rpcError) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("transaction_pin_enabled, transaction_pin_hash" as any)
          .eq("id", user.id)
          .single();

        if (profileError) throw rpcError;

        const pinEnabled = Boolean((profile as any)?.transaction_pin_enabled);
        const pinHash = String((profile as any)?.transaction_pin_hash || "");

        if (!pinEnabled || !pinHash) {
          setError("Incorrect PIN or PIN not enabled");
          return false;
        }

        if (pinHash.startsWith("sha256$")) {
          const parts = pinHash.split("$");
          if (parts.length !== 3) {
            setError("Incorrect PIN");
            return false;
          }
          const salt = parts[1];
          const expectedHash = parts[2];
          const actualHash = await sha256Hex(`${salt}${pin}`);
          if (actualHash !== expectedHash) {
            setError("Incorrect PIN");
            return false;
          }
          return true;
        }

        throw rpcError;
      }

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

  return { verifyPin, checkIfPinRequired, isLoading, error };
};
