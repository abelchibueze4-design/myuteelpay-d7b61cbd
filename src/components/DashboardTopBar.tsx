import { Moon, Sun, Monitor } from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { AccountSettings } from "@/components/AccountSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DashboardTopBar = () => {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || "User";
  const initials = displayName[0]?.toUpperCase();

  const ThemeIcon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex-1" />
      
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Theme Toggle Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Toggle theme"
            >
              <ThemeIcon className="w-5 h-5 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
              <Sun className="w-4 h-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
              <Moon className="w-4 h-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
              <Monitor className="w-4 h-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Account Settings - Avatar Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          
          <AccountSettings />

          {/* Avatar with initials or image */}
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
