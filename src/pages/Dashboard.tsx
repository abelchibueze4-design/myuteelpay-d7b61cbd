import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SettingsPage from "@/pages/SettingsPage";
import {
  Wallet, Smartphone, Tv, Zap, MessageSquare, GraduationCap,
  Gift, ArrowRight, Mail, MessageCircle, Users, Eye, EyeOff,
  Plus, History, Headphones, Share2, TrendingUp, ArrowDownLeft,
  ArrowUpRight, Activity, HelpCircle, Menu, Bell, ShieldCheck,
  Moon, Sun,
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem, ScaleTap } from "@/components/PageTransition";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { OnboardingTour } from "@/components/OnboardingTour";
import TransactionHistory from "@/components/TransactionHistory";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { SetupTransactionPinModal } from "@/components/SetupTransactionPinModal";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { AccountSettings } from "@/components/AccountSettings";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { useWallet } from "@/hooks/useWallet";
import { useTransactions } from "@/hooks/useTransactions";
import { useFundWallet } from "@/hooks/useFundWallet";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useSidebar } from "@/components/ui/sidebar";
import { useKycVerified, BALANCE_LIMIT_UNVERIFIED } from "@/hooks/useKyc";
import { useTheme } from "next-themes";
import { useKycVerified, BALANCE_LIMIT_UNVERIFIED } from "@/hooks/useKyc";

const quickActions = [
  { icon: Smartphone, label: "Airtime", path: "/services/airtime", color: "text-primary bg-primary/10", border: "border-primary/20" },
  { icon: Smartphone, label: "Data", path: "/services/data", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10", border: "border-blue-500/20" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "text-orange-600 dark:text-orange-400 bg-orange-500/10", border: "border-orange-500/20" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "text-accent-foreground bg-accent/15", border: "border-accent/20" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "text-pink-600 dark:text-pink-400 bg-pink-500/10", border: "border-pink-500/20" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", border: "border-emerald-500/20" },
];

const Dashboard = () => {
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: isKycVerified } = useKycVerified();
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions(5);
  const { initializePayment, verifyPayment, isInitializing } = useFundWallet();
  const { settings, isSettingsLoading } = useSecuritySettings();
  const { settings: platformSettings } = usePlatformSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fundOpen, setFundOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (!isSettingsLoading && !settings.transactionPinEnabled) {
      // Check if user has already skipped or we should force it.
      // For now, let's just show it if not set.
      setPinSetupOpen(true);
    }
  }, [isSettingsLoading, settings.transactionPinEnabled]);

  const { data: referredUsers } = useQuery({
    queryKey: ["referredUsers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("referred_users").select("*").eq("referrer_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: mySignupReferral } = useQuery({
    queryKey: ["mySignupReferral", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("referred_users").select("*").eq("referred_user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const referrerBonus = Array.isArray(referredUsers) 
    ? referredUsers.filter(r => !r.is_claimed).reduce((sum, r) => sum + (Number(r.reward_amount) || 10), 0) 
    : 0;
  
  const signupBonus = (mySignupReferral && !mySignupReferral.referee_is_claimed) 
    ? (Number(mySignupReferral.referee_reward_amount) || 10) 
    : 0;
    
  const bonusBalance = referrerBonus + signupBonus;

  const activeTab = searchParams.get("tab");

  // No longer opening a dialog for settings

  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || "User";

  const formatAmount = (amount: number) => `₦${Math.abs(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  const formatType = (type: string) => type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference) {
      setSearchParams({}, { replace: true });
      verifyPayment(reference);
    }
  }, [searchParams, setSearchParams, verifyPayment]);

  useEffect(() => {
    if (searchParams.get("fund") === "true") {
      setFundOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("fund");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const isLoading = !user;

  if (activeTab === "transactions") return <TransactionHistory filter="services" />;
  if (activeTab === "history") return <TransactionHistory filter="all" />;
  if (activeTab === "wallet") return <TransactionHistory filter="wallet" />;
  if (activeTab === "settings") return <SettingsPage />;

  if (isLoading) return <DashboardSkeleton />;


  const handleFund = () => {
    const val = Number(amount);
    const minFund = platformSettings.min_wallet_fund || 100;
    if (!val || val < minFund) { toast.error(`Minimum amount is ₦${minFund.toLocaleString()}`); return; }
    if (!isKycVerified) {
      const currentBalance = wallet?.balance ?? 0;
      if (currentBalance + val > BALANCE_LIMIT_UNVERIFIED) {
        toast.error(`Without KYC, your balance cannot exceed ₦${BALANCE_LIMIT_UNVERIFIED.toLocaleString()}. Complete KYC to remove this limit.`);
        return;
      }
    }
    setFundOpen(false);
    initializePayment(val);
  };

  return (
    <PageTransition className="min-h-screen bg-background relative">
      <OnboardingTour />
      <div className="hidden">
        <AccountSettings 
          open={settingsOpen} 
          onOpenChange={(open) => {
            setSettingsOpen(open);
            if (!open && activeTab === "settings") {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("tab");
              setSearchParams(newParams, { replace: true });
            }
          }} 
        />
      </div>
      <SetupTransactionPinModal
        open={pinSetupOpen}
        onComplete={() => setPinSetupOpen(false)}
        isRequired={false}
      />
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpenMobile(true)}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center tap-target"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-base font-extrabold text-foreground">Welcome, {displayName}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center tap-target"
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
            </button>
            <NotificationsDropdown />
          </div>
        </div>
      </div>

      {/* Desktop Header - kept for large screens */}
      <div className="hidden lg:block">
        <DashboardTopBar />
        <div className="relative overflow-hidden bg-primary px-4 pt-10 pb-24 lg:px-8">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-white/20 blur-3xl animate-pulse" />
            <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-accent/30 blur-3xl" />
          </div>
          <div className="container mx-auto relative z-10">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Overview Dashboard</p>
            <h1 className="text-3xl font-extrabold text-white mt-1">Welcome, {displayName}</h1>
            <p className="text-white/60 text-sm mt-2">Ready to pay your bills today?</p>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="max-w-[420px] lg:max-w-7xl mx-auto px-4 lg:px-4 lg:-mt-16 relative z-20 space-y-4 lg:space-y-8 pb-24 lg:pb-12 pt-4 lg:pt-0">

        {/* Wallet Balance Card */}
        <div className="fintech-card p-5 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-primary-foreground border-none shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-accent/20 rounded-full -ml-10 -mb-10 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 text-white rounded-full mb-3">
                <Wallet className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Main Wallet</span>
              </div>

            <div className="flex items-center gap-2 mb-4">
              <p className="text-3xl lg:text-4xl font-black tracking-tighter text-white">
                {showBalance ? `₦${(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "₦ • • • • • •"}
              </p>
              <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors tap-target">
                {showBalance ? <EyeOff className="w-4 h-4 text-white/70" /> : <Eye className="w-4 h-4 text-white/70" />}
              </button>
            </div>

            <div className="flex gap-2.5">
              <Dialog open={fundOpen} onOpenChange={setFundOpen}>
                <DialogTrigger asChild>
                   <Button variant="ghost" className="flex-1 !bg-white !text-primary font-bold h-11 rounded-2xl text-sm gap-1.5 tap-target hover:!bg-white/90 shadow-lg shadow-black/10 border-0">
                     <Plus className="w-4 h-4 !text-primary" /> Add Money
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-none shadow-2xl max-w-[380px] mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" /> Fund Wallet
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-foreground">₦</span>
                        <Input type="number" placeholder="0.00" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-9 h-14 text-xl font-black rounded-2xl border-2 focus-visible:ring-primary/20 bg-secondary/30" />
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-1">Min: ₦100 · Instant Crediting</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 2000, 5000].map((v) => (
                        <button key={v} onClick={() => setAmount(String(v))} className="py-2 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-xs font-bold tap-target">
                          ₦{v.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <Button className="w-full h-12 rounded-2xl btn-gold text-sm font-bold" onClick={handleFund} disabled={isInitializing}>
                      {isInitializing ? "Processing..." : "Continue to Payment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Link to="/services/referral?tab=bonus" className="flex-1">
                 <Button variant="outline" className="w-full h-11 rounded-2xl text-xs font-bold border-2 border-white/40 bg-white/15 text-white hover:bg-white/25 gap-1.5 tap-target backdrop-blur-sm">
                   <Gift className="w-4 h-4 text-accent" />
                   <span>Bonus ₦{(bonusBalance || 0).toLocaleString()}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Service status banner */}
        {platformSettings.service_status_visible && (() => {
          const statusStyles = {
            operational: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
            degraded: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
            outage: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
          };
          const st = platformSettings.service_status || "operational";
          return (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${statusStyles[st]}`}>
              <Activity className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold">{platformSettings.service_status_message || "All services are running smoothly"}</span>
            </div>
          );
        })()}

        {/* KYC Banner */}
        {!isKycVerified && (
          <Link to="/kyc">
            <div className="fintech-card p-4 border-2 border-amber-500/30 bg-amber-500/10 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-foreground">Complete KYC Verification</p>
                  <p className="text-[10px] text-muted-foreground">Your balance limit is ₦{BALANCE_LIMIT_UNVERIFIED.toLocaleString()}. Verify to unlock premium services.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              </div>
            </div>
          </Link>
        )}
        {isKycVerified && (
          <div className="fintech-card p-3 border border-emerald-500/30 bg-emerald-500/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">KYC Verified — Premium Account</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-foreground">Quick Actions</h2>
            <Link to="/services/airtime" className="text-[11px] font-bold text-primary">View All</Link>
          </div>
          <StaggerContainer className="grid grid-cols-3 gap-2.5">
            {quickActions.map((a) => (
              <StaggerItem key={a.path}>
                <Link to={a.path}>
                  <ScaleTap>
                    <div className="fintech-card p-3 tap-target text-center group">
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-2 mx-auto border transition-transform group-hover:scale-110", a.color, a.border)}>
                        <a.icon className="w-5 h-5" />
                      </div>
                      <p className="text-[11px] font-bold text-foreground">{a.label}</p>
                    </div>
                  </ScaleTap>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-foreground">Recent Activity</h2>
            <Link to="/dashboard?tab=history" onClick={() => setSearchParams({ tab: "history" })} className="text-[11px] font-bold text-primary">
              See All
            </Link>
          </div>

          <div className="fintech-card divide-y divide-border/30 overflow-hidden">
            {transactions && transactions.length > 0 ? (
              transactions.map((t) => {
                const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus" || t.type === "refund";
                const isSuccess = t.status === "success";
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isCredit ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                        {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate">{t.description || formatType(t.type)}</p>
                        <p className="text-[9px] text-muted-foreground">{format(new Date(t.created_at), "MMM d, h:mm a")}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-[11px] font-extrabold", isCredit ? "text-emerald-600" : "text-foreground")}>
                        {isCredit ? "+" : "-"}{formatAmount(t.amount)}
                      </p>
                      <p className={cn("text-[8px] font-bold uppercase tracking-wider", isSuccess ? "text-emerald-500" : t.status === "failed" ? "text-red-500" : "text-amber-500")}>
                        {t.status}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Fund your wallet and start using services — your transactions will show up here."
                actionLabel="Fund Wallet"
                onAction={() => setFundOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Support Card - compact */}
        <div className="fintech-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-foreground">Need Help?</h3>
              <p className="text-[10px] text-muted-foreground">24/7 support available</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <a href="mailto:support@uteelpay.com" className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-secondary/50 hover:bg-primary/5 transition-all tap-target">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-[9px] font-bold text-foreground">Email</span>
            </a>
            <a href="https://wa.me/2349022334478" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-secondary/50 hover:bg-emerald-50 transition-all tap-target">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-bold text-foreground">WhatsApp</span>
            </a>
            <Link to="/faqs" className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-secondary/50 hover:bg-orange-50 transition-all tap-target">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              <span className="text-[9px] font-bold text-foreground">FAQs</span>
            </Link>
          </div>
        </div>

        {/* Community Card */}
        <div className="fintech-card p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-xs font-extrabold text-foreground">UteelPay Insider</span>
            </div>
            <Badge variant="secondary" className="text-[9px] bg-accent/10 text-accent-foreground border-none">Official</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">Get daily promo codes and news first.</p>
          <a href="https://whatsapp.com/channel/0029Vb77x43It5rpyEOK2N1y" target="_blank" rel="noopener noreferrer">
            <Button className="w-full btn-gold h-10 rounded-xl text-xs font-bold gap-1.5 tap-target">
              Join Channel <Share2 className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
