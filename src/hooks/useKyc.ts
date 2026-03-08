import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KycSubmission {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  id_type: string;
  id_number: string;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const BALANCE_LIMIT_UNVERIFIED = 10000;

export function useKycStatus() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["kyc-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_submissions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as KycSubmission | null;
    },
    enabled: !!user,
  });
}

export function useKycVerified() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["kyc-verified", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("kyc_verified")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return (data as any)?.kyc_verified === true;
    },
    enabled: !!user,
  });
}

export function useSubmitKyc() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      full_name: string;
      date_of_birth: string;
      address: string;
      id_type: string;
      id_number: string;
    }) => {
      const { error } = await supabase
        .from("kyc_submissions" as any)
        .upsert({
          user_id: user!.id,
          ...values,
          status: "pending",
        }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("KYC submitted successfully! We'll review it shortly.");
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit KYC");
    },
  });
}

// Admin hooks
export function useAllKycSubmissions() {
  return useQuery({
    queryKey: ["admin-kyc-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_submissions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as KycSubmission[];
    },
  });
}

export function useReviewKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: "approved" | "rejected"; admin_notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("kyc_submissions" as any)
        .update({
          status,
          admin_notes: admin_notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("KYC review saved");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-submissions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to review KYC");
    },
  });
}
