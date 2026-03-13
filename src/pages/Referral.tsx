import { Copy, Gift, Users, Wallet, ArrowRight, Check } from "lucide-react";
import { PageBackButton } from "@/components/PageBackButton";
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

  // Fetch people the user referred
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

  // Fetch the user's own signup referral record (to check referee bonus)
  const { data: mySignupReferral } = useQuery({
    queryKey: ["mySignupReferral", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referred_users")
        .select("*")
        .eq("referred_user_id", user!.id)
        .maybeSingle();
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
    onError: () => {
      toast.error("Transfer failed. Please try again later.");
    }
  });

  const refLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    toast.success("Referral link copied!");
  };

  const unclaimedUsers = Array.isArray(referredUsers) ? referredUsers.filter(r => !r.is_claimed) : [];
  const totalReferrals = unclaimedUsers.length;

  // Sum of: Unclaimed Referral rewards + Unclaimed Referee (Signup) reward
  const referrerBonus = unclaimedUsers.reduce((sum, r) => sum + (Number(r.reward_amount) || 10), 0);
  const signupBonus = (mySignupReferral && !mySignupReferral.referee_is_claimed)
    ? (Number(mySignupReferral.referee_reward_amount) || 10)
    : 0;

  const totalEarnings = referrerBonus + signupBonus;

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
    <div className="min-h-screen bg-background pb-20">
      {/* Compact header */}
      <div className="bg-primary px-4 pt-8 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 flex items-center gap-3 max-w-lg mx-auto">
          <PageBackButton />
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Refer & Earn</h1>
            <p className="text-white/60 text-[10px] font-medium">Invite friends, get rewarded.</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-20 max-w-lg mx-auto">
        {/* Compact tab switcher */}
        <div className="flex bg-card p-1.5 rounded-2xl shadow-lg shadow-primary/5 mb-5 border border-border/50">
          <button
            onClick={() => setSearchParams({ tab: "referral" })}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
              activeTab === "referral" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Users className="w-3.5 h-3.5" /> My Network
          </button>
          <button
            onClick={() => setSearchParams({ tab: "bonus" })}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
              activeTab === "bonus" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Wallet className="w-3.5 h-3.5" /> Bonus Funds
          </button>
        </div>

        {activeTab === "referral" ? (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Network</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-foreground">{totalReferrals}</p>
                  <p className="text-[9px] font-black text-muted-foreground">/ 10</p>
                </div>
                <div className="mt-2 w-full bg-secondary h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${Math.min((totalReferrals / 10) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm">
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-0.5">Commissions</p>
                <p className="text-2xl font-black text-white">₦{totalEarnings.toLocaleString()}</p>
                <p className="mt-2 text-emerald-400 font-bold text-[9px] uppercase flex items-center gap-1">
                  Claimable <ArrowRight className="w-2.5 h-2.5" />
                </p>
              </div>
            </div>

            {/* Share link */}
            <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
              <h2 className="text-sm font-black text-foreground mb-0.5">Share Your Link</h2>
              <p className="text-[10px] font-medium text-muted-foreground mb-3">Earn bonuses when people join through you.</p>
              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-xl border border-dashed border-border/50">
                <div className="flex-1 px-2 text-[10px] font-bold text-foreground truncate">
                  {refLink || "Generating link..."}
                </div>
                <Button onClick={copyLink} disabled={!referralCode} size="sm" className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs shadow-sm">
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                </Button>
              </div>
              {referralCode && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Code</p>
                    <p className="text-base font-black text-primary tracking-tight uppercase">{referralCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Referral code copied!"); }}
                    className="rounded-lg border-primary/20 text-primary font-bold text-[10px] h-8 hover:bg-primary/5"
                  >
                    Copy Code
                  </Button>
                </div>
              )}
            </div>

            {/* Referrals list */}
            <div>
              <h3 className="text-sm font-black text-foreground mb-2 px-1">Recent Referrals</h3>
              <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/30 shadow-sm overflow-hidden">
                {(mySignupReferral || (referredUsers && referredUsers.length > 0)) ? (
                  <>
                    {mySignupReferral && (
                      <div className="flex items-center justify-between p-3.5 bg-accent/5 hover:bg-accent/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent text-xs font-black">ME</div>
                          <div>
                            <p className="font-black text-xs text-foreground">Signup Bonus</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{format(new Date((mySignupReferral as any).created_at), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <Badge className={cn("border-none px-2 py-0.5 font-black text-[8px] uppercase", (mySignupReferral as any).referee_is_claimed ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600")}>
                            {(mySignupReferral as any).referee_is_claimed ? "Claimed" : "Available"}
                          </Badge>
                          <p className="text-[10px] font-black text-foreground">+ ₦{((mySignupReferral as any).referee_reward_amount || 10).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {referredUsers?.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-3.5 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
                            {(r.profiles as any)?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-black text-xs text-foreground">{(r.profiles as any)?.full_name || "New User"}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <Badge className={cn("border-none px-2 py-0.5 font-black text-[8px] uppercase", r.is_claimed ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600")}>
                            {r.is_claimed ? "Claimed" : "Available"}
                          </Badge>
                          <p className="text-[10px] font-black text-foreground">+ ₦{(r.reward_amount || 10).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-10 px-6 text-center flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">No referrals yet</h3>
                      <p className="text-xs text-muted-foreground max-w-[240px] mx-auto mt-1 leading-relaxed">
                        Share your referral link with friends and earn ₦10 for each person who signs up!
                      </p>
                    </div>
                    <Button size="sm" onClick={copyLink} className="rounded-xl font-bold text-xs mt-1">
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Referral Link
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bonus card */}
            <div className={cn(
              "rounded-2xl p-6 text-center text-white relative overflow-hidden shadow-lg transition-all",
              transferThresholdReached ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-slate-600 to-slate-800"
            )}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">Claimable Bonus</p>
              <h2 className="text-4xl font-black mb-3 tracking-tighter">₦{totalEarnings.toLocaleString()}</h2>
              <div className="mb-5 space-y-1.5">
                <p className="text-[10px] font-bold text-white/80">
                  {totalReferrals < 10 ? `${totalReferrals}/10 Referrals` : "Goal Reached!"}
                </p>
                <div className="w-max mx-auto px-3 py-1 rounded-full bg-black/20 text-[9px] font-black uppercase tracking-widest">
                  Min: 10 Refs + ₦100
                </div>
              </div>
              <Button
                onClick={handleTransfer}
                disabled={transferMutation.isPending || !transferThresholdReached}
                className={cn(
                  "w-full h-12 rounded-xl font-black text-sm gap-2 transition-all shadow-lg",
                  transferThresholdReached
                    ? "bg-white text-emerald-600 hover:bg-white/90"
                    : "bg-white/10 text-white/40 cursor-not-allowed shadow-none"
                )}
              >
                {transferMutation.isPending ? "Processing..." : "Transfer to Wallet"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* How it works */}
            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm text-center">
              <h3 className="text-sm font-black text-foreground mb-3">How it works</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto font-black text-xs">1</div>
                  <p className="text-[10px] font-black">Invite</p>
                  <p className="text-[9px] text-muted-foreground">Share your link</p>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mx-auto font-black text-xs">2</div>
                  <p className="text-[10px] font-black">Hold</p>
                  <p className="text-[9px] text-muted-foreground">Pending review</p>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-black text-xs">3</div>
                  <p className="text-[10px] font-black">Claim</p>
                  <p className="text-[9px] text-muted-foreground">Transfer to wallet</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showTransferSuccess} onOpenChange={setShowTransferSuccess}>
        <DialogContent className="max-w-xs text-center p-8 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black mb-1 tracking-tight">Funds Transferred!</h2>
          <p className="text-[10px] text-muted-foreground font-medium mb-5">Bonus added to your wallet.</p>
          <Button className="w-full h-11 rounded-xl bg-primary font-black text-sm" onClick={() => setShowTransferSuccess(false)}>Great!</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Referral;
