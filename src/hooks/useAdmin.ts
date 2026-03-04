import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "super_admin" | "support_staff" | "finance_team" | "service_manager" | "admin";

export const useAdmin = () => {
    const { user, loading: authLoading } = useAuth();

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["admin_profile_role", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user!.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const role = profile?.role as AdminRole | null;
    const isAdmin = role === "admin" || role === "super_admin";

    return {
        isAdmin,
        role,
        loading: authLoading || profileLoading,
        isSuperAdmin: role === "super_admin" || role === "admin",
        isSupport: role === "support_staff",
        isFinance: role === "finance_team",
        isServiceManager: role === "service_manager",
    };
};
