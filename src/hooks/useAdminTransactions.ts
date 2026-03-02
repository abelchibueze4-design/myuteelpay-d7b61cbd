import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminTransactions = () => {
    return useQuery({
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
};
