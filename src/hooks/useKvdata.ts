import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function callKvdata(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/kvdata`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function useKvdata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: callKvdata,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Transaction failed");
    },
  });
}
