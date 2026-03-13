import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Wallet, Smartphone, Tv, Zap, GraduationCap, Gift, Globe, Landmark, Plane, Building,
  ArrowRight, Eye, EyeOff, Plus, History, TrendingUp, ArrowDownLeft, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* ---------------- Mobile Dashboard Header ---------------- */
const DashboardHeader = ({ userName = "User" }) => (
  <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
    <div className="mobile-container py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Good morning</p>
          <h1 className="text-xl font-bold text-gray-900">Hi, {userName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="tap-target">
            <History className="w-5 h-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="tap-target">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- Wallet Balance Card ---------------- */
const WalletCard = ({ balance = 125000, showBalance = true, onToggleVisibility }) => (
  <Card className="fintech-card p-6 mx-4 mb-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Wallet Balance</span>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="tap-target w-8 h-8"
        onClick={onToggleVisibility}
      >
        {showBalance ? <Eye className="w-4 h-4 text-purple-600" /> : <EyeOff className="w-4 h-4 text-purple-600" />}
      </Button>
    </div>
    
    <div className="mb-6">
      <p className="text-3xl font-bold text-purple-700 mb-1">
        {showBalance ? `₦${balance.toLocaleString()}` : '₦ • • • • • •'}
      </p>
      <div className="flex items-center gap-1 text-xs text-purple-600">
        <TrendingUp className="w-3 h-3" />
        <span>+2.5% this week</span>
      </div>
    </div>

    <div className="flex gap-3">
      <Button className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold h-12 rounded-xl">
        <Plus className="w-4 h-4 mr-2" />
        Add Money
      </Button>
      <Button variant="outline" className="flex-1 border-purple-200 text-purple-700 font-bold h-12 rounded-xl hover:bg-purple-50">
        Transfer
      </Button>
    </div>
  </Card>
);

/* ---------------- Quick Action Grid ---------------- */
const quickActions = [
  { icon: Smartphone, label: "Airtime", path: "/services/airtime", color: "bg-purple-100 text-purple-600", desc: "Buy airtime" },
  { icon: Smartphone, label: "Data", path: "/services/data", color: "bg-blue-100 text-blue-600", desc: "Data bundles" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "bg-orange-100 text-orange-600", desc: "DSTV, GOtv" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "bg-yellow-100 text-yellow-600", desc: "Pay bills" },
  { icon: Globe, label: "Int'l Airtime", path: "/services/intl-airtime", color: "bg-indigo-100 text-indigo-600", desc: "Global top-up" },
  { icon: Shield, label: "Insurance", path: "/services/insurance", color: "bg-teal-100 text-teal-600", desc: "Motor & more" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "bg-pink-100 text-pink-600", desc: "Send SMS" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "bg-green-100 text-green-600", desc: "WAEC, NECO" },
  { icon: Landmark, label: "Bank Transfer", path: "#", color: "bg-muted text-muted-foreground", desc: "Coming Soon", disabled: true },
];

const QuickActionsGrid = () => (
  <div className="px-4 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
      <Link to="/services" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
        View All
      </Link>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {quickActions.map((action, index) => (
        action.disabled ? (
          <div key={index} className="fintech-card p-4 tap-target opacity-50 cursor-not-allowed">
            <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 mx-auto`}>
              <action.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800 text-center mb-1">{action.label}</p>
            <p className="text-[10px] text-muted-foreground text-center font-semibold">Coming Soon</p>
          </div>
        ) : (
          <Link key={index} to={action.path}>
            <div className="fintech-card p-4 tap-target hover:scale-105 transition-all hover:border-purple-200">
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 mx-auto`}>
                <action.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800 text-center mb-1">{action.label}</p>
              <p className="text-xs text-gray-500 text-center">{action.desc}</p>
            </div>
          </Link>
        )
      ))}
    </div>
  </div>
);

/* ---------------- Recent Transactions ---------------- */
const RecentTransactions = ({ transactions = [] }) => (
  <div className="px-4 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
      <Link to="/dashboard?tab=history" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
        See All
      </Link>
    </div>
    
    <div className="space-y-3">
      {transactions.length > 0 ? (
        transactions.slice(0, 3).map((transaction, index) => (
          <div key={index} className="fintech-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center`}>
                {transaction.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{transaction.description}</p>
                <p className="text-xs text-gray-500">{transaction.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-gray-800'}`}>
                {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
              </p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                transaction.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {transaction.status}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="fintech-card p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-2">No transactions yet</p>
          <p className="text-xs text-gray-500">Your recent payments will appear here</p>
        </div>
      )}
    </div>
  </div>
);

/* ---------------- Referral Card ---------------- */
const ReferralCard = () => (
  <div className="px-4 mb-6">
    <Card className="fintech-card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-bold text-yellow-700">Refer & Earn</span>
        </div>
        <span className="text-xs font-semibold text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">
          ₦500 Bonus
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-4">Invite friends and earn ₦500 for each successful referral!</p>
      <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold h-12 rounded-xl">
        Share Referral Link
      </Button>
    </Card>
  </div>
);

/* ---------------- Sticky Bottom Navigation ---------------- */
const BottomNavigation = ({ activeTab = "home" }) => {
  const navItems = [
    { icon: Smartphone, label: "Home", path: "/dashboard", key: "home" },
    { icon: Zap, label: "Services", path: "/services", key: "services" },
    { icon: Wallet, label: "Wallet", path: "/dashboard?tab=wallet", key: "wallet" },
    { icon: Gift, label: "Referrals", path: "/referral", key: "referrals" },
  ];

  return (
    <nav className="bottom-nav border-t border-gray-200">
      <div className="mobile-container flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link 
            key={item.key} 
            to={item.path} 
            className={`flex flex-col items-center tap-target py-2 px-3 rounded-xl transition-colors ${
              activeTab === item.key ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-1 ${activeTab === item.key ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

/* ---------------- Mobile Dashboard ---------------- */
const MobileDashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  
  // Mock data - replace with actual data from your hooks
  const mockTransactions = [
    {
      id: 1,
      description: "MTN Airtime",
      amount: 2000,
      type: "debit",
      status: "success",
      date: "Today, 2:30 PM"
    },
    {
      id: 2,
      description: "Wallet Top-up",
      amount: 50000,
      type: "credit",
      status: "success",
      date: "Today, 1:15 PM"
    },
    {
      id: 3,
      description: "DSTV Subscription",
      amount: 24500,
      type: "debit",
      status: "success",
      date: "Yesterday, 8:45 PM"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName="John" />
      
      <main className="pt-4 pb-20">
        <WalletCard 
          balance={125000} 
          showBalance={showBalance} 
          onToggleVisibility={() => setShowBalance(!showBalance)}
        />
        <QuickActionsGrid />
        <RecentTransactions transactions={mockTransactions} />
        <ReferralCard />
      </main>
      
      <BottomNavigation activeTab="home" />
    </div>
  );
};

export default MobileDashboard;