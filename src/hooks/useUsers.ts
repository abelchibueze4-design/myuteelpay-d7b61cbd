import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUsers = () => {
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
                // Since email is in auth.users (not public), we use username/full_name
                // In a real app, you'd have a trigger to sync email to profiles
                email: profile.username ? `${profile.username}@example.com` : "no-email@example.com",
                status: profile.deactivated_at ? "inactive" : "active",
            }));
        },
    });
};
