import { Bell, Check, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useMyNotifications, useMarkRead } from "@/hooks/useNotifications";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "transaction": return "💳";
    case "wallet": return "💰";
    case "promo": return "🎁";
    case "security": return "🔒";
    case "referral": return "👥";
    case "system": return "⚙️";
    default: return "🔔";
  }
};

export const NotificationsDropdown = () => {
  const { data: notifications = [] } = useMyNotifications();
  const markRead = useMarkRead();
  const queryClient = useQueryClient();

  // Realtime subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my_notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate(id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 20).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer gap-1"
                onClick={() => handleMarkRead(notification.id, notification.is_read)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-base mt-0.5 shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          notification.is_read ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              You'll see transaction updates and announcements here
            </p>
          </div>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <p className="text-xs text-muted-foreground">
                Showing latest {Math.min(notifications.length, 20)} notifications
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
