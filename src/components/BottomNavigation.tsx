import { Link, useLocation } from "react-router-dom";
import { Home, Zap, Wallet, Gift, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard", key: "home" },
  { icon: Zap, label: "Services", path: "/services", key: "services" },
  { icon: Wallet, label: "Wallet", path: "/dashboard?tab=wallet", key: "wallet" },
  { icon: Gift, label: "Referrals", path: "/services/referral", key: "referrals" },
  { icon: User, label: "Profile", path: "/dashboard?tab=settings", key: "profile" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const path = location.pathname + location.search;

  const getActiveKey = () => {
    if (path.includes("tab=wallet")) return "wallet";
    if (path.includes("tab=settings")) return "profile";
    if (path.includes("/services")) return "services";
    if (path.includes("/referral")) return "referrals";
    if (path.includes("/dashboard")) return "home";
    return "home";
  };

  const activeKey = getActiveKey();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border/50 lg:hidden">
      <div className="max-w-[420px] mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex flex-col items-center min-w-[56px] py-1.5 px-2 rounded-xl transition-all duration-200 tap-target ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className={`relative ${isActive ? "scale-110" : ""} transition-transform duration-200`}>
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={`text-[10px] font-semibold mt-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
