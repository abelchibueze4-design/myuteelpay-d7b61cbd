import { Copy, Gift, Users, Wallet, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const Referral = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showTransferSuccess, setShowTransferSuccess] = useState(false);
  const activeTab = searchParams.get("tab") || "referral";

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

  const transferMutation = useMutation({
    mutationFn: async (amount: number) => {
      // Note: In production, this should be a managed RPC to handle balance logic securely
      const { error } = await supabase.rpc('transfer_referral_bonus' as any, {
        user_id_param: user!.id,
        amount_to_transfer: amount
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["referredUsers"] });
      setShowTransferSuccess(true);
      toast.success("Bonus transferred to wallet!");
    },
    onError: (error: any) => {
      toast.error("Transfer failed: " + error.message);
    }
  });

  const refLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    toast.success("Referral link copied!");
  };

  const unclaimedUsers = (referredUsers as any[])?.filter(r => !r.is_claimed) || [];
  const totalReferrals = unclaimedUsers.length;
  const totalEarnings = unclaimedUsers.reduce((sum, r) => sum + (r.reward_amount || 10), 0);

  const handleTransfer = () => {
    if (totalReferrals < 10) {
      toast.error("Threshold not reached! You need at least 10 referrals to transfer bonus.");
      return;
    }
    if (totalEarnings < 100) {
      toast.error("Insufficient bonus balance! Minimum transfer is ₦100.");
      return;
    }
    transferMutation.mutate(totalEarnings);
  };

  const transferThresholdReached = totalReferrals >= 10 && totalEarnings >= 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-24">
      <div className="bg-primary px-4 pt-12 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="container mx-auto relative z-10 flex flex-col items-center text-center max-w-2xl">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-xl border border-white/10">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Refer & Earn Big</h1>
          <p className="text-white/70 text-sm font-medium">Invite your friends and get rewarded for every successful signup.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-20 max-w-3xl">
        <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[2rem] shadow-xl shadow-primary/5 mb-8 border border-border/50">
          <button
            onClick={() => setSearchParams({ tab: "referral" })}
            className={cn(
              "flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all flex items-center justify-center gap-2",
              activeTab === "referral" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Users className="w-4 h-4" /> My Network
          </button>
          <button
            onClick={() => setSearchParams({ tab: "bonus" })}
            className={cn(
              "flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all flex items-center justify-center gap-2",
              activeTab === "bonus" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Wallet className="w-4 h-4" /> Bonus Funds
          </button>
        </div>

        {activeTab === "referral" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-border/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform blur-xl" />
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Network</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-foreground">{totalReferrals}</p>
                  <p className="text-[10px] font-black text-muted-foreground">/ 10 GOAL</p>
                </div>
                <div className="mt-4 w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-1000"
                    style={{ width: `${Math.min((totalReferrals / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform blur-xl" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 text-white/50">Total Commissions</p>
                <p className="text-4xl font-black text-white">₦{totalEarnings.toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase">
                  Available to claim <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-border/50 shadow-sm">
              <h2 className="text-lg font-black text-foreground mb-1 tracking-tight">Share Your Link</h2>
              <p className="text-xs font-medium text-muted-foreground mb-6">Earn instant bonuses when people join through you.</p>

              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-2xl border-2 border-dashed border-border/50">
                <div className="flex-1 px-3 text-xs font-black text-foreground truncate">
                  {refLink || "Generating your unique link..."}
                </div>
                <Button onClick={copyLink} disabled={!referralCode} className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-transform active:scale-95">
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
              </div>

              {referralCode && (
                <div className="mt-6 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Your Referral Code</p>
                    <p className="text-2xl font-black text-primary tracking-tighter uppercase">{referralCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      toast.success("Referral code copied!");
                    }}
                    className="rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/5"
                  >
                    Copy Code
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-foreground tracking-tight px-2">Recent Referrals</h3>
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-border/50 divide-y divide-border/30 shadow-sm overflow-hidden">
                {referredUsers && referredUsers.length > 0 ? (
                  referredUsers.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-6 group hover:bg-slate-50 dark:hover:bg-slate-700/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-black transition-transform group-hover:scale-110">
                          {(r.profiles as any)?.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-black text-sm text-foreground">{(r.profiles as any)?.full_name || "New Uteel User"}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={cn(
                          "border-none px-3 py-1 font-black text-[10px] uppercase",
                          r.is_claimed ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {r.is_claimed ? "Claimed" : "Available"}
                        </Badge>
                        <p className="text-xs font-black text-foreground">
                          + ₦{(r.reward_amount || 10).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center opacity-40 grayscale flex flex-col items-center gap-4">
                    <Users className="w-12 h-12" />
                    <p className="font-bold text-sm">Your network is empty. Start sharing!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={cn(
              "rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden shadow-2xl transition-all duration-500",
              transferThresholdReached ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-200" : "bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-200"
            )}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-2">Claimable Bonus</p>
              <h2 className="text-6xl font-black mb-4 tracking-tighter">₦{totalEarnings.toLocaleString()}</h2>

              <div className="mb-10 space-y-2">
                <p className="text-[11px] font-bold opacity-80 decoration-primary text-white/90">
                  {totalReferrals < 10 ? `Progress: ${totalReferrals}/10 Referrals Required` : "Referral Goal Reached!"}
                </p>
                <div className="w-max mx-auto px-4 py-1.5 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-widest">
                  Threshold: 10 Refs + ₦100 Balance
                </div>
              </div>

              <Button
                onClick={handleTransfer}
                disabled={transferMutation.isPending || !transferThresholdReached}
                className={cn(
                  "w-full h-16 rounded-2xl font-black text-lg gap-2 transition-all shadow-xl",
                  transferThresholdReached
                    ? "bg-white text-emerald-600 hover:bg-white/90 shadow-emerald-800/20"
                    : "bg-white/10 text-white/40 cursor-not-allowed shadow-none"
                )}
              >
                {transferMutation.isPending ? "Processing..." : "Transfer to Wallet"} <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border border-border/50 shadow-sm text-center">
              <h3 className="text-lg font-black text-foreground mb-4 tracking-tight">How it works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto font-black">1</div>
                  <p className="text-xs font-black">Invite Friends</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Friend joins via link</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto font-black">2</div>
                  <p className="text-xs font-black">Hold Funds</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Pending verification</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-black">3</div>
                  <p className="text-xs font-black">Instant Transfer</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Transfer to your wallet</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showTransferSuccess} onOpenChange={setShowTransferSuccess}>
        <DialogContent className="max-w-sm text-center p-12 rounded-[2.5rem]">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight">Funds Transferred!</h2>
          <p className="text-xs text-muted-foreground font-medium mb-8">Your bonus has been successfully added to your main wallet balance.</p>
          <Button className="w-full h-14 rounded-2xl bg-primary font-black" onClick={() => setShowTransferSuccess(false)}>Great!</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Referral;
