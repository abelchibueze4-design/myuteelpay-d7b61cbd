import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Wallet, Smartphone, Tv, Zap, MessageSquare, GraduationCap,
  Gift, ArrowRight, Mail, MessageCircle, Users, Eye, EyeOff,
  Plus, History, Headphones, Share2, TrendingUp, ArrowDownLeft,
  ArrowUpRight, Activity,
} from "lucide-react";
import TransactionHistory from "@/components/TransactionHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useTransactions } from "@/hooks/useTransactions";
import { useFundWallet } from "@/hooks/useFundWallet";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const quickActions = [
  { icon: Smartphone, label: "Airtime", path: "/services/airtime", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", border: "border-purple-100" },
  { icon: Smartphone, label: "Data", path: "/services/data", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", border: "border-orange-100" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-100" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20", border: "border-pink-100" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100" },
  { icon: Gift, label: "Refer & Earn", path: "/referral", color: "text-accent text-accent-foreground bg-accent/10", border: "border-accent/10" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions(5);
  const { initializePayment, verifyPayment, isInitializing } = useFundWallet();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fundOpen, setFundOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);

  const activeTab = searchParams.get("tab");
  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || "User";

  const formatAmount = (amount: number) =>
    `₦${Math.abs(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  const formatType = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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

  if (activeTab === "history") {
    return <TransactionHistory filter="services" />;
  }

  if (activeTab === "wallet") {
    return <TransactionHistory filter="wallet" />;
  }

  const handleFund = () => {
    const val = Number(amount);
    if (!val || val < 100) {
      toast.error("Minimum amount is ₦100");
      return;
    }
    setFundOpen(false);
    initializePayment(val);
  };

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] min-h-screen flex flex-col font-sans">
      <DashboardTopBar />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary px-4 pt-10 pb-24 sm:pt-12 sm:pb-32 lg:px-8">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-white/20 blur-3xl animate-pulse" />
          <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-accent/30 blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium tracking-wide uppercase">Overview Dashboard</p>
              <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
                Hey, {displayName} <span className="animate-wave inline-block">👋</span>
              </h1>
              <p className="text-white/60 text-sm mt-2 font-medium">Ready to pay your bills today?</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/dashboard?tab=history"
                onClick={() => setSearchParams({ tab: "history" })}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all border border-white/10"
              >
                <History className="w-4 h-4" /> History
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 sm:-mt-20 relative z-20 space-y-8 pb-12">
        {/* Main Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Card - Full Width */}
          <div className="lg:col-span-3 relative overflow-hidden glass-card rounded-3xl p-8 transition-all hover:shadow-primary/10">
            {/* Background Gradient Detail */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 px-3 py-1 bg-primary/10 text-primary w-fit rounded-full">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Main Wallet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground">
                      {showBalance ? `₦${(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "₦ • • • • • •"}
                    </p>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 hover:bg-accent/10 rounded-full transition-colors mt-1"
                    >
                      {showBalance ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <TrendingUp className="w-8 h-8 text-primary opacity-60" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-10 lg:mt-16">
                <Dialog open={fundOpen} onOpenChange={setFundOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border-none font-bold text-base gap-2 group">
                      Add Money <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" /> Fund Wallet
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Deposit Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl text-foreground">₦</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min={100}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-10 h-16 text-2xl font-black rounded-2xl border-2 focus-visible:ring-primary/20 bg-secondary/30"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic ml-1">Min: ₦100.00 · Instant Crediting</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[500, 1000, 2000, 5000].map((v) => (
                          <button
                            key={v}
                            onClick={() => setAmount(String(v))}
                            className="py-2.5 px-1 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-xs font-bold"
                          >
                            ₦{v.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <Button
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20"
                        onClick={handleFund}
                        disabled={isInitializing}
                      >
                        {isInitializing ? "Processing..." : "Continue to Payment"}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 opacity-40 grayscale pointer-events-none">
                        <div className="h-4 w-auto"><img src="https://paystack.com/assets/payment-logos/paystack-badge-light.png" alt="Secured by Paystack" className="h-full" /></div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="h-12 px-8 rounded-2xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-bold text-base transition-all">
                  Withdrawal
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid (Quick Actions) */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">Premium Services</h2>
              <p className="text-xs text-muted-foreground font-medium">Quick and secure utility payments</p>
            </div>
            <Link to="/services" className="text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2">View All</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {quickActions.map((a, i) => (
              <Link
                key={a.path}
                to={a.path}
                className={cn(
                  "relative group bg-white dark:bg-slate-800/50 rounded-3xl p-6 shadow-sm border border-border/40 hover:border-primary/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 flex flex-col items-center justify-center",
                  i === 6 ? "bg-accent/5" : ""
                )}
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", a.color, "border", a.border)}>
                  <a.icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-extrabold text-foreground tracking-tight text-center">{a.label}</p>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & Support */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-foreground">Recent Activity</h2>
              <Link
                to="/dashboard?tab=history"
                onClick={() => setSearchParams({ tab: "history" })}
                className="text-xs font-bold px-3 py-1 bg-secondary rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
              >
                Full records
              </Link>
            </div>

            <div className="bg-card rounded-3xl border border-border/50 divide-y divide-border/30 overflow-hidden shadow-sm">
              {transactions && transactions.length > 0 ? (
                transactions.map((t) => {
                  const isSuccess = t.status === "success";
                  const isCredit = t.type === "wallet_fund";
                  return (
                    <div key={t.id} className="flex items-center justify-between p-5 hover:bg-accent/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                          isCredit ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
                        )}>
                          {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{t.description || formatType(t.type)}</p>
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{format(new Date(t.created_at), "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("font-extrabold text-sm", isCredit ? "text-emerald-600" : "text-foreground")}>
                          {isCredit ? "+" : "-"}{formatAmount(t.amount)}
                        </p>
                        <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5",
                          isSuccess ? "text-emerald-500" : t.status === "failed" ? "text-red-500" : "text-amber-500"
                        )}>
                          {t.status}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto opacity-40">
                    <Activity className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground italic tracking-tight">Your recent payments will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Content: Support & Community */}
          <div className="space-y-6">
            {/* Customer Support */}
            <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform blur-2xl" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-1 tracking-tight">Need Help?</h3>
                <p className="text-xs text-muted-foreground font-medium mb-8 leading-relaxed">Our support team is active 24/7 to resolve any payment issues.</p>

                <div className="space-y-3">
                  <a href="mailto:support@uteelpay.com" className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-primary/10 group/btn transition-all">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Email Support</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                  </a>
                  <a href="https://wa.me/2347036006762" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-emerald-500/10 group/btn transition-all">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-foreground">WhatsApp Hub</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-emerald-500 transition-colors" />
                  </a>
                </div>
              </div>
            </div>

            {/* Community Channel */}
            <div className="bg-gradient-to-br from-accent to-accent/80 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-brass/20 group">
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/10 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-none hover:bg-white/30">Official</Badge>
                </div>
                <h3 className="text-xl font-black mb-1 tracking-tight">UteelPay Insider</h3>
                <p className="text-white/80 text-xs font-medium mb-8">Don't miss out! Get daily promo codes and news first.</p>

                <a
                  href="https://whatsapp.com/channel/uteelpay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full h-12 rounded-2xl bg-white text-accent-foreground text-sm font-black hover:bg-white/90 transition-all shadow-md gap-2"
                >
                  Join Channel <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Nav spacing for mobile */}
        <div className="h-20 lg:hidden" />
      </div>
    </div>
  );
};

export default Dashboard;
