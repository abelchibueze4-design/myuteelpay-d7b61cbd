import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  provider?: string;
}

interface VirtualAccountResult {
  gateways: string[];
  references: string[];
  amount: number;
  bankAccounts: BankAccount[];
  message: string;
  expiresIn: string;
}

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

async function callVirtualAccount(amount: number, gateways: string[]) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/virtual-account?action=create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ amount, gateways }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create payment account");
  return data as VirtualAccountResult;
}

export function useFundWallet() {
  const queryClient = useQueryClient();
  const verifiedRefs = useRef(new Set<string>());
  const { user } = useAuth();
  const [virtualAccountData, setVirtualAccountData] = useState<VirtualAccountResult | null>(null);

  const initMutation = useMutation({
    mutationFn: async ({ amount, publicKey }: { amount: number; publicKey: string }) => {
      return new Promise<{ reference: string }>((resolve, reject) => {
        const handler = (window as any).PaystackPop.setup({
          key: publicKey,
          email: user?.email || "",
          amount: Math.round(amount * 100),
          currency: "NGN",
          metadata: { user_id: user?.id },
          callback: (response: { reference: string }) => {
            resolve(response);
          },
          onClose: () => {
            reject(new Error("Payment cancelled"));
          },
        });
        handler.openIframe();
      });
    },
    onSuccess: async (data) => {
      try {
        const result = await callPaystack("verify", { reference: data.reference });
        toast.success(`Wallet funded! New balance: ₦${Number(result.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      } catch {
        toast.error("Payment verification failed. If you were charged, your wallet will be updated shortly.");
      }
    },
    onError: (err: Error) => {
      if (err.message !== "Payment cancelled") {
        toast.error("Unable to initialize payment. Please try again.");
      }
    },
  });

  const virtualAccountMutation = useMutation({
    mutationFn: async ({ amount, gateways }: { amount: number; gateways: string[] }) => {
      return callVirtualAccount(amount, gateways);
    },
    onSuccess: (data) => {
      setVirtualAccountData(data);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate payment account. Please try again.");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (reference: string) => {
      if (verifiedRefs.current.has(reference)) {
        return { skipped: true };
      }
      verifiedRefs.current.add(reference);
      return callPaystack("verify", { reference });
    },
    onSuccess: (data: any) => {
      if (data?.skipped) return;
      toast.success(`Wallet funded! New balance: ₦${Number(data.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: () => {
      toast.error("Payment verification failed. If you were charged, your wallet will be updated shortly.");
    },
  });

  const initializePayment = useCallback((amount: number, publicKey: string) => {
    initMutation.mutate({ amount, publicKey });
  }, [initMutation]);

  const initializeVirtualAccount = useCallback((amount: number, gateways: string[]) => {
    virtualAccountMutation.mutate({ amount, gateways });
  }, [virtualAccountMutation]);

  const clearVirtualAccount = useCallback(() => {
    setVirtualAccountData(null);
  }, []);

  return {
    initializePayment,
    initializeVirtualAccount,
    clearVirtualAccount,
    virtualAccountData,
    verifyPayment: useCallback((ref: string) => verifyMutation.mutate(ref), [verifyMutation]),
    isInitializing: initMutation.isPending || virtualAccountMutation.isPending,
    isVerifying: verifyMutation.isPending,
  };
}
