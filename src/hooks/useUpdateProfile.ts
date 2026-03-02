import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileUpdateData {
  full_name?: string;
  phone_number?: string;
  address?: string;
  avatar_url?: string;
}

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update auth metadata
      const updateData: Record<string, string> = {};
      if (data.full_name) updateData.full_name = data.full_name;
      if (data.phone_number) updateData.phone_number = data.phone_number;
      if (data.address) updateData.address = data.address;

      if (Object.keys(updateData).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: updateData,
        });
        if (authError) throw authError;
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number,
          address: data.address,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      setError("User not authenticated");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate unique filename
      const ext = file.name.split(".").pop();
      const filename = `${user.id}-${Date.now()}.${ext}`;
      const path = `avatars/${filename}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload avatar";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, uploadAvatar, isLoading, error };
};
