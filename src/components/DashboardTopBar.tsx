import { Bell } from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { AccountSettings } from "@/components/AccountSettings";
import { useAuth } from "@/contexts/AuthContext";

export const DashboardTopBar = () => {
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || "User";
  const initials = displayName[0]?.toUpperCase();

  return (
    <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex-1" />
      
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notifications */}
        <NotificationsDropdown />

        {/* Account Settings - Avatar Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          
          <AccountSettings />

          {/* Avatar with initials or image - Hidden on mobile as BottomNav handles profile */}
          <div className="hidden sm:block">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
