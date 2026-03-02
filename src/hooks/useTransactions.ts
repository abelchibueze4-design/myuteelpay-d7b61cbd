import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TransactionType = Database["public"]["Enums"]["transaction_type"];

interface CreateTransactionParams {
  type: TransactionType;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export const useTransactions = (limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTransactionParams) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user!.id,
          type: params.type,
          amount: params.amount,
          description: params.description,
          status: "success",
          metadata: params.metadata as Database["public"]["Tables"]["transactions"]["Insert"]["metadata"],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};
