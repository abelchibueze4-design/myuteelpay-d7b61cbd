import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  // Service types
  airtime_enabled: boolean;
  data_enabled: boolean;
  cable_tv_enabled: boolean;
  electricity_enabled: boolean;
  
  edu_pins_enabled: boolean;
  // Channels
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  // Types
  transaction_updates: boolean;
  promotions: boolean;
  service_reminders: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  airtime_enabled: true,
  data_enabled: true,
  cable_tv_enabled: true,
  electricity_enabled: true,
  
  edu_pins_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  transaction_updates: true,
  promotions: true,
  service_reminders: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (data) {
        setPreferences(data as any);
      } else {
        const { data: newPrefs, error: createError } = await supabase
          .from("notification_preferences" as any)
          .insert([{ user_id: user.id, ...DEFAULT_PREFERENCES }])
          .select()
          .single();

        if (createError) throw createError;
        if (newPrefs) setPreferences(newPrefs as any);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to fetch notification preferences";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (
    updates: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("notification_preferences" as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setPreferences((prev) => ({ ...prev, ...updates }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update notification preferences";
      setError(message);
      return false;
    }
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  };
};
