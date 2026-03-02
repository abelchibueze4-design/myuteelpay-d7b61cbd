import { useAuth } from "@/contexts/AuthContext";

export type AdminRole = "super_admin" | "support_staff" | "finance_team" | "service_manager";

export const useAdmin = () => {
    const { user, loading } = useAuth();

    // For demonstration and until a proper role system is in place,
    // we'll check user_metadata for the role.
    // In a real scenario, this would come from a dedicated 'roles' table or JWT claims.
    const role = user?.user_metadata?.role as AdminRole | undefined;

    // Also allowing a bypass for specific emails for initial setup if needed
    const isAdmin = !!role || user?.email?.endsWith("@uteelpay.com");

    return {
        isAdmin,
        role,
        loading,
        isSuperAdmin: role === "super_admin",
        isSupport: role === "support_staff",
        isFinance: role === "finance_team",
        isServiceManager: role === "service_manager",
    };
};
