import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useUsers = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Real-time synchronization for admin users and their balances
        const profileChannel = supabase
            .channel("admin-profiles-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
                queryClient.invalidateQueries({ queryKey: ["admin_users"] });
            })
            .subscribe();

        const walletChannel = supabase
            .channel("admin-wallets-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => {
                queryClient.invalidateQueries({ queryKey: ["admin_users"] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(walletChannel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: ["admin_users"],
        queryFn: async () => {
            // Fetch profiles and join with wallets
            const { data, error } = await supabase
                .from("profiles")
                .select(`
          *,
          wallets (
            balance
          )
        `);

            if (error) {
                console.error("Error fetching users:", error);
                throw error;
            }

            return data.map((profile: any) => ({
                ...profile,
                wallet_balance: profile.wallets?.balance ?? 0,
                email: profile.email || profile.username || "—",
                status: profile.deactivated_at ? "inactive" : "active",
            }));
        },
    });
};
