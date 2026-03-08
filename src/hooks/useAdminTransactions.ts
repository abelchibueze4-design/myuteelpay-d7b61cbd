import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export const useAdminTransactions = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel("admin-transactions-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "transactions",
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["admin_transactions"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const query = useQuery({
        queryKey: ["admin_transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select(`
          *,
          profiles (
            full_name,
            username
          )
        `)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching transactions:", error);
                throw error;
            }

            return data.map((t: any) => ({
                ...t,
                user_name: t.profiles?.full_name || t.profiles?.username || "Unknown",
                user_handle: t.profiles?.username || "unknown",
            }));
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: "pending" | "success" | "failed" }) => {
            const { error } = await supabase
                .from("transactions")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_transactions"] });
            toast.success("Transaction status updated");
        },
        onError: (err: Error) => {
            toast.error("Failed to update status: " + err.message);
        },
    });

    return { ...query, updateStatus: updateStatusMutation.mutateAsync, isUpdating: updateStatusMutation.isPending };
};
