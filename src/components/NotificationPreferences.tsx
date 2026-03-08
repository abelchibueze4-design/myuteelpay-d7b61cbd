import { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { toast } from "sonner";

const otherServiceTypes = [
  { id: "cable_tv_enabled", label: "Cable TV", icon: Bell },
  { id: "electricity_enabled", label: "Electricity", icon: Smartphone },
  { id: "bulk_sms_enabled", label: "Bulk SMS", icon: MessageSquare },
  { id: "edu_pins_enabled", label: "Education Pins", icon: Bell },
];

const channels = [
  { id: "email_enabled", label: "Email", icon: Mail },
  { id: "sms_enabled", label: "SMS", icon: MessageSquare },
  { id: "in_app_enabled", label: "In-App", icon: Bell },
];

const notificationTypes = [
  { id: "transaction_updates", label: "Transaction Updates" },
  { id: "promotions", label: "Promotions & Offers" },
  { id: "service_reminders", label: "Service Reminders" },
];

export const NotificationPreferences = () => {
  const { preferences, isLoading, error: hookError, updatePreferences } =
    useNotificationPreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = async (key: string) => {
    const updated = {
      ...localPreferences,
      [key]: !localPreferences[key as keyof typeof localPreferences],
    };
    setLocalPreferences(updated);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const updates: Record<string, boolean> = {};
    
    Object.entries(localPreferences).forEach(([key, value]) => {
      if (key !== "id" && key !== "user_id" && typeof value === "boolean") {
        updates[key] = value;
      }
    });

    const success = await updatePreferences(updates as Partial<typeof localPreferences>);
    setIsSaving(false);

    if (success) {
      toast.success("Notification preferences saved");
    } else {
      toast.error(hookError || "Failed to save preferences");
    }
  };

  return (
    <div className="space-y-6">
      {/* Airtime Section */}
      <div className="space-y-3 p-4 border border-primary/20 bg-primary/5 rounded-lg">
        <div>
          <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Airtime Notifications
          </h3>
          <p className="text-xs text-muted-foreground">
            Get notified about airtime purchases and offers
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <Label
            htmlFor="airtime_enabled"
            className="cursor-pointer font-medium text-sm"
          >
            Enable Airtime Notifications
          </Label>
          <Switch
            id="airtime_enabled"
            checked={localPreferences.airtime_enabled ?? true}
            onCheckedChange={() => handleToggle("airtime_enabled")}
          />
        </div>
      </div>

      {/* Data Section */}
      <div className="space-y-3 p-4 border border-blue-500/20 bg-blue-500/5 rounded-lg">
        <div>
          <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Data Notifications
          </h3>
          <p className="text-xs text-muted-foreground">
            Get notified about data purchases and offers
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <Label
            htmlFor="data_enabled"
            className="cursor-pointer font-medium text-sm"
          >
            Enable Data Notifications
          </Label>
          <Switch
            id="data_enabled"
            checked={localPreferences.data_enabled ?? true}
            onCheckedChange={() => handleToggle("data_enabled")}
          />
        </div>
      </div>

      {/* Other Services Section */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Other Services
          </h3>
          <p className="text-xs text-muted-foreground">
            Notifications for cable TV, electricity, bulk SMS, and education pins
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {otherServiceTypes.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <service.icon className="w-4 h-4 text-primary" />
                </div>
                <Label
                  htmlFor={service.id}
                  className="cursor-pointer font-medium text-sm"
                >
                  {service.label}
                </Label>
              </div>
              <Switch
                id={service.id}
                checked={
                  Boolean(localPreferences[
                    service.id as keyof typeof localPreferences
                  ] ?? true)
                }
                onCheckedChange={() => handleToggle(service.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Channels Section */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Notification Channels
          </h3>
          <p className="text-xs text-muted-foreground">
            Choose how you want to receive notifications
          </p>
        </div>

        <div className="space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <channel.icon className="w-4 h-4 text-blue-600" />
                </div>
                <Label
                  htmlFor={channel.id}
                  className="cursor-pointer font-medium text-sm"
                >
                  {channel.label}
                </Label>
              </div>
              <Switch
                id={channel.id}
                checked={
                  Boolean(localPreferences[channel.id as keyof typeof localPreferences] ??
                  true)
                }
                onCheckedChange={() => handleToggle(channel.id)}
              />
            </div>
          ))}
        </div>

        {!localPreferences.email_enabled &&
          !localPreferences.sms_enabled &&
          !localPreferences.in_app_enabled && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-700">
              ⚠️ You have all notification channels disabled. You won't receive
              any notifications.
            </div>
          )}
      </div>

      {/* Notification Types Section */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Types of Notifications
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage what types of notifications you receive
          </p>
        </div>

        <div className="space-y-2">
          {notificationTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Label
                htmlFor={type.id}
                className="cursor-pointer font-medium text-sm"
              >
                {type.label}
              </Label>
              <Switch
                id={type.id}
                checked={
                  Boolean(localPreferences[
                    type.id as keyof typeof localPreferences
                  ] ?? true)
                }
                onCheckedChange={() => handleToggle(type.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 text-blue-500" /> Tip:</p>
        <p>
          We recommend enabling transaction updates and service reminders to
          stay informed about your account activities.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleSaveAll}
          disabled={isSaving || isLoading}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
};
