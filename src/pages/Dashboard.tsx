import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Wallet, Smartphone, Tv, Zap, MessageSquare, GraduationCap,
<<<<<<< HEAD
  Gift, ArrowRight, Bell, Mail, MessageCircle, Users,
=======
  Gift, ArrowRight,
>>>>>>> 5014fa118e4f8f949d6f23552f1936f75bdaf0d4
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useTransactions } from "@/hooks/useTransactions";
import { useFundWallet } from "@/hooks/useFundWallet";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect } from "react";

const quickActions = [
  { icon: Smartphone, label: "Airtime & Data", path: "/services/airtime", color: "bg-primary/10 text-primary" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "bg-accent/20 text-accent-foreground" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "bg-primary-glow/10 text-primary" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "bg-accent/20 text-accent-foreground" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "bg-primary/10 text-primary" },
  { icon: Gift, label: "Refer & Earn", path: "/referral", color: "bg-accent/20 text-accent-foreground" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions(5);
  const { initializePayment, verifyPayment, isInitializing, isVerifying } = useFundWallet();
  const [searchParams, setSearchParams] = useSearchParams();

  const [fundOpen, setFundOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || "User";

  const formatAmount = (amount: number) =>
    `₦${Math.abs(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  const formatType = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Handle Paystack callback
  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference) {
      // Clear the query param
      setSearchParams({}, { replace: true });
      verifyPayment(reference);
    }
  }, [searchParams, setSearchParams, verifyPayment]);

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
    <div className="bg-secondary min-h-full">
      <div className="gradient-hero px-4 pt-6 pb-16">
        <div className="container mx-auto">
          <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
          <h1 className="text-xl font-bold text-primary-foreground">{displayName} 👋</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        {/* Wallet Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-3xl font-extrabold">
                ₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-accent" />
            </div>
          </div>

          <Dialog open={fundOpen} onOpenChange={setFundOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm" className="w-full sm:w-auto">
                Fund Wallet <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fund Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Amount (₦)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 1000"
                    min={100}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum: ₦100</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[500, 1000, 2000, 5000].map((v) => (
                    <Button
                      key={v}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(String(v))}
                    >
                      ₦{v.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={handleFund}
                  disabled={isInitializing}
                >
                  {isInitializing ? "Processing..." : "Pay with Paystack"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Actions */}
        <h2 className="font-bold text-lg mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {quickActions.map((a) => (
            <Link key={a.path} to={a.path} className="bg-card rounded-xl p-4 text-center shadow-card hover:shadow-primary/10 transition-shadow">
              <div className={`w-11 h-11 rounded-lg ${a.color} flex items-center justify-center mx-auto mb-2`}>
                <a.icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium leading-tight">{a.label}</p>
            </Link>
          ))}
        </div>

        {/* Recent Transactions */}
        <h2 className="font-bold text-lg mb-3">Recent Transactions</h2>
        <div className="bg-card rounded-2xl shadow-card divide-y mb-8">
          {transactions && transactions.length > 0 ? (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-sm">{t.description || formatType(t.type)}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, h:mm a")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatAmount(t.amount)}</p>
                  <p className={`text-xs font-medium ${t.status === "success" ? "text-green-600" : t.status === "failed" ? "text-destructive" : "text-accent"}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet</div>
          )}
        </div>

        {/* Footer Section - Support & Community */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Customer Support Card */}
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Customer Support</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Get help or reach out to us</p>
            <div className="space-y-3">
              <a 
                href="mailto:support@uteelpay.com"
                className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-muted-foreground">support@uteelpay.com</p>
                </div>
              </a>
              <a 
                href="https://wa.me/2347036006762"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">WhatsApp Chat</p>
                  <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
                </div>
              </a>
            </div>
          </div>

          {/* Join Community Card */}
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-lg">Join Our Community</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Stay updated with exclusive offers</p>
            <a 
              href="https://whatsapp.com/channel/uteelpay"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-600/10 rounded-lg hover:bg-green-600/20 transition-colors border border-green-600/30 w-full"
            >
              <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">WhatsApp Channel</p>
                <p className="text-xs text-muted-foreground">Join for updates & offers</p>
              </div>
              <ArrowRight className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
