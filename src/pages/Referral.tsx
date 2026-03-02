import { Copy, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Referral = () => {
  
  const { user } = useAuth();

  const { data: referralCode } = useQuery({
    queryKey: ["referralCode", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.code ?? "";
    },
    enabled: !!user,
  });

  const { data: referredUsers } = useQuery({
    queryKey: ["referredUsers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referred_users")
        .select("*, profiles!referred_users_referred_user_id_fkey(full_name)")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const refLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    toast.success("Referral link copied!");
  };

  const totalReferrals = referredUsers?.length ?? 0;
  const totalEarnings = totalReferrals * 10;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="gradient-hero px-4 py-6">
        <div className="container mx-auto">
          <h1 className="text-lg font-bold text-primary-foreground">Refer & Earn</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-2">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-5 shadow-card text-center">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-extrabold">{totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-card text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-extrabold text-gradient">₦{totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
          <h2 className="font-bold mb-1">Your Referral Link</h2>
          <p className="text-xs text-muted-foreground mb-3">Share and earn ₦10 for each signup</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm font-mono truncate">
              {refLink || "Loading..."}
            </div>
            <Button variant="gold" size="icon" onClick={copyLink} disabled={!referralCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h2 className="font-bold text-lg mb-3">Referred Users</h2>
        <div className="bg-card rounded-2xl shadow-card divide-y mb-8">
          {referredUsers && referredUsers.length > 0 ? (
            referredUsers.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {(r.profiles as any)?.full_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{(r.profiles as any)?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-accent">₦10</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No referrals yet. Share your link!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Referral;
