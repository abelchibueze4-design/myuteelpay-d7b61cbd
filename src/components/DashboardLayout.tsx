import { ReactNode, useEffect } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import {
  Smartphone, Tv, Zap, GraduationCap,
  Gift, LayoutDashboard, LogOut, History, Wallet, Menu, ShieldCheck,
  HelpCircle, Settings, CreditCard, Coins, Plus, Globe, Landmark, Plane, Building
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";

import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Fund Wallet", url: "/dashboard?fund=true", icon: Plus },
  { title: "Wallet History", url: "/dashboard?tab=wallet", icon: Wallet },
  { title: "History", url: "/dashboard?tab=history", icon: History },
  { title: "KYC Verification", url: "/kyc", icon: ShieldCheck },
  { title: "Referral", url: "/services/referral", icon: Gift },
  { title: "Bonus to Wallet", url: "/services/referral?tab=bonus", icon: Coins },
];

const serviceItems = [
  { title: "Airtime", url: "/services/airtime", icon: Smartphone },
  { title: "Data", url: "/services/data", icon: Smartphone },
  { title: "Data Card", url: "/services/data-card", icon: CreditCard },
  { title: "Cable TV", url: "/services/cable", icon: Tv },
  { title: "Electricity", url: "/services/electricity", icon: Zap },
  { title: "Int'l Airtime", url: "/services/intl-airtime", icon: Globe },
  { title: "Edu Pins", url: "/services/edu", icon: GraduationCap },
  { title: "Flights", url: "#", icon: Plane, disabled: true },
  { title: "Hotels", url: "#", icon: Building, disabled: true },
  { title: "Bank Transfer", url: "#", icon: Landmark, disabled: true },
];

const otherItems = [
  { title: "Account Settings", url: "/dashboard?tab=settings", icon: Settings },
  { title: "FAQs", url: "/faqs", icon: HelpCircle },
];

function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  

  const handleLogout = async () => {
    if (isMobile) setOpenMobile(false);
    await signOut();
    navigate("/");
  };

  const handleItemClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || "User";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 flex items-center gap-2">
          {!collapsed && <span className="flex items-center gap-2"><img src={logo} alt="Uteelpay" className="h-10 w-auto" /><span className="text-xl font-bold text-gradient">Uteelpay</span></span>}
          {collapsed && <img src={logo} alt="U" className="h-10 w-auto" />}
        </div>

        <SidebarGroup className="bg-sidebar-accent/30 rounded-lg mx-2 p-2">
          <SidebarGroupLabel className="text-sidebar-primary font-semibold text-xs uppercase tracking-wider">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={() => handleItemClick()}>
                    <NavLink to={item.url} end className="text-sidebar-primary hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={() => handleItemClick()}>
                    <NavLink to="/admin" className="hover:bg-sidebar-accent/50 text-primary font-semibold" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="bg-sidebar-accent/30 rounded-lg mx-2 p-2">
          <SidebarGroupLabel className="text-sidebar-primary font-semibold text-xs uppercase tracking-wider">Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {serviceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.disabled ? (
                    <SidebarMenuButton className="opacity-50 cursor-not-allowed pointer-events-none">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && <span className="ml-auto text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>}
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton asChild onClick={() => handleItemClick()}>
                      <NavLink to={item.url} end className="text-sidebar-primary hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="bg-sidebar-accent/30 rounded-lg mx-2 p-2">
          <SidebarGroupLabel className="text-sidebar-primary font-semibold text-xs uppercase tracking-wider">Support & More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={() => handleItemClick()}>
                    <NavLink to={item.url} className="text-sidebar-primary hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        

        <div className="mt-auto p-4 border-t border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{displayName}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50">
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  useSessionTimeout();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop header */}
          <header className="h-14 hidden lg:flex items-center border-b px-4 bg-background">
            <SidebarTrigger className="mr-4">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="flex items-center gap-2"><img src={logo} alt="Uteelpay" className="h-10 w-auto" /><span className="text-lg font-bold text-gradient">Uteelpay</span></span>
          </header>
          <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>
          {/* Mobile bottom nav */}
          <BottomNavigation />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
