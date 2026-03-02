import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

interface NotificationsDropdownProps {
  notifications?: Notification[];
}

export const NotificationsDropdown = ({
  notifications = [],
}: NotificationsDropdownProps) => {
  // Mock notifications for demonstration
  const mockNotifications: Notification[] = [
    {
      id: "1",
      title: "Wallet Funded",
      message: "Your wallet has been successfully funded with ₦5,000",
      type: "success",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
    {
      id: "2",
      title: "Transaction Completed",
      message: "Airtime purchase of ₦1,000 completed successfully",
      type: "success",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false,
    },
    {
      id: "3",
      title: "Special Offer",
      message: "Get 10% bonus on your next wallet fund",
      type: "info",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
    },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;
  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-destructive";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-blue-600";
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
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {displayNotifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {displayNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer gap-1">
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${notification.read ? "text-muted-foreground" : "text-foreground"}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className={`text-xs ${getNotificationColor(notification.type)}`}>
                  {formatTime(notification.timestamp)}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center text-primary cursor-pointer hover:bg-primary/5">
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
