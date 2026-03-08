import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  service_type: string;
  label: string;
  identifier: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const useFavorites = (serviceType: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id, serviceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("service_type", serviceType)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Favorite[];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async ({ label, identifier, metadata = {} }: { label: string; identifier: string; metadata?: Record<string, any> }) => {
      const { error } = await supabase
        .from("favorites" as any)
        .upsert(
          { user_id: user!.id, service_type: serviceType, label, identifier, metadata } as any,
          { onConflict: "user_id,service_type,identifier" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id, serviceType] });
      toast.success("Saved to favorites!");
    },
    onError: () => toast.error("Failed to save favorite"),
  });

  const removeFavorite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("favorites" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id, serviceType] });
      toast.success("Removed from favorites");
    },
    onError: () => toast.error("Failed to remove favorite"),
  });

  const isFavorited = (identifier: string) =>
    favorites.some((f) => f.identifier === identifier);

  const getFavorite = (identifier: string) =>
    favorites.find((f) => f.identifier === identifier);

  return { favorites, isLoading, addFavorite, removeFavorite, isFavorited, getFavorite };
};
