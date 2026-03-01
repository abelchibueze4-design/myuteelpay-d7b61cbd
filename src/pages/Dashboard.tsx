import { Link } from "react-router-dom";
import {
  Wallet, Smartphone, Tv, Zap, MessageSquare, GraduationCap,
  Gift, ArrowRight, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";

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

  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || "User";

  const formatAmount = (amount: number) =>
    `₦${Math.abs(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  const formatType = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
          <Button variant="hero" size="sm" className="w-full sm:w-auto">
            Fund Wallet <ArrowRight className="w-4 h-4" />
          </Button>
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
      </div>
    </div>
  );
};

export default Dashboard;
