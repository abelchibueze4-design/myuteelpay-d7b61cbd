import { Link, useNavigate } from "react-router-dom";
import {
  Wallet, Smartphone, Tv, Zap, MessageSquare, GraduationCap,
  Gift, ArrowRight, Bell, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const quickActions = [
  { icon: Smartphone, label: "Airtime & Data", path: "/services/airtime", color: "bg-primary/10 text-primary" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "bg-accent/20 text-accent-foreground" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "bg-primary-glow/10 text-primary" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "bg-accent/20 text-accent-foreground" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "bg-primary/10 text-primary" },
  { icon: Gift, label: "Refer & Earn", path: "/referral", color: "bg-accent/20 text-accent-foreground" },
];

const transactions = [
  { id: 1, type: "MTN Airtime", amount: "₦500", date: "Today, 2:30 PM", status: "Success" },
  { id: 2, type: "DSTV Compact", amount: "₦10,500", date: "Yesterday, 11:00 AM", status: "Success" },
  { id: 3, type: "IKEDC Prepaid", amount: "₦5,000", date: "Feb 27, 9:15 AM", status: "Success" },
  { id: 4, type: "GLO Data 2GB", amount: "₦1,000", date: "Feb 26, 4:00 PM", status: "Pending" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="gradient-hero px-4 pt-6 pb-16">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
            <h1 className="text-xl font-bold text-primary-foreground">Chinedu 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </button>
            <button onClick={() => navigate("/")} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 -mt-10">
        {/* Wallet Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-3xl font-extrabold">₦24,500<span className="text-lg">.00</span></p>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Recent Transactions</h2>
          <button className="text-sm text-primary font-medium">View All</button>
        </div>
        <div className="bg-card rounded-2xl shadow-card divide-y mb-8">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-sm">{t.type}</p>
                <p className="text-xs text-muted-foreground">{t.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{t.amount}</p>
                <p className={`text-xs font-medium ${t.status === "Success" ? "text-green-600" : "text-accent"}`}>{t.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
