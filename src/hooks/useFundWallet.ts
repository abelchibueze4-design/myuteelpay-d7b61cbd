import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";

async function callPaystack(action: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/paystack?action=${action}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function useFundWallet() {
  const queryClient = useQueryClient();

  const initMutation = useMutation({
    mutationFn: async (amount: number) => {
      const callback_url = `${window.location.origin}/dashboard`;
      return callPaystack("initialize", { amount, callback_url });
    },
    onSuccess: (data) => {
      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (reference: string) => {
      return callPaystack("verify", { reference });
    },
    onSuccess: (data) => {
      toast.success(`Wallet funded! New balance: ₦${Number(data.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    initializePayment: initMutation.mutate,
    verifyPayment: useCallback((ref: string) => verifyMutation.mutate(ref), [verifyMutation]),
    isInitializing: initMutation.isPending,
    isVerifying: verifyMutation.isPending,
  };
}
