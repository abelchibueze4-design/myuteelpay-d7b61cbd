import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import bcrypt from "bcryptjs";

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

        // Check if it's our previous SHA-256 format (legacy support)
        if (pinHash.startsWith("sha256$")) {
          // Force reset if legacy format found, or just support it for now.
          // Let's support it for now to avoid locking users out if they just set it.
          const parts = pinHash.split("$");
          if (parts.length === 3) {
            const salt = parts[1];
            const expectedHash = parts[2];
            const encoder = new TextEncoder();
            const data = encoder.encode(salt + pin);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const actualHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
            
            if (actualHash === expectedHash) return true;
          }
        }
        
        // Try bcrypt compare
        try {
          const isMatch = bcrypt.compareSync(pin, pinHash);
          if (isMatch) return true;
        } catch (e) {
          console.error("Bcrypt compare error:", e);
        }

        setError("Incorrect PIN");
        return false;
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
