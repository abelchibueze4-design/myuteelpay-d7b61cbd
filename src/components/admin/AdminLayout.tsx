import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Users, Receipt, Settings, ShieldCheck, Bell,
    LogOut, Package, BarChart3, Menu, X, Wallet, GitBranch,
    FileText, AlertTriangle, ChevronDown, ChevronRight, Shield,
    TrendingUp, Zap, Scale,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface NavItem {
    title: string;
    url: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    { title: "Executive Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    {
        title: "Users",
        url: "/admin/users",
        icon: Users,
        children: [
            { title: "All Users", url: "/admin/users", icon: Users },
            { title: "KYC Review", url: "/admin/users/kyc", icon: ShieldCheck },
        ],
    },
    {
        title: "Wallet & Finance",
        url: "/admin/finance",
        icon: Wallet,
        children: [
            { title: "Ledger Control", url: "/admin/finance", icon: Wallet },
            { title: "Refunds", url: "/admin/finance/refunds", icon: Receipt },
        ],
    },
    { title: "Transactions", url: "/admin/transactions", icon: Receipt },
    { title: "Services", url: "/admin/services", icon: Package },
    { title: "Referrals", url: "/admin/referrals", icon: GitBranch },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    {
        title: "Security",
        url: "/admin/security",
        icon: Shield,
        badge: "Live",
        badgeColor: "bg-red-500",
        children: [
            { title: "Activity Logs", url: "/admin/logs", icon: ShieldCheck },
            { title: "IP & Sessions", url: "/admin/security", icon: Shield },
        ],
    },
    { title: "Reconciliation", url: "/admin/reconciliation", icon: Scale, badge: "Auto", badgeColor: "bg-primary" },
    { title: "Notifications", url: "/admin/notifications", icon: Bell, badge: "New", badgeColor: "bg-amber-500" },
    { title: "Reports", url: "/admin/reports", icon: FileText },
    { title: "Settings", url: "/admin/settings", icon: Settings },
];

const SidebarNavItem = ({
    item,
    collapsed,
}: {
    item: NavItem;
    collapsed: boolean;
}) => {
    const location = useLocation();
    const [open, setOpen] = useState(() =>
        item.children?.some((c) => location.pathname === c.url)
    );
    const isActive = location.pathname === item.url;
    const hasChildren = !!item.children?.length;

    if (hasChildren && !collapsed) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                        "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        open && "text-foreground bg-accent/30"
                    )}
                >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge && (
                        <span className={`w-2 h-2 rounded-full ${item.badgeColor || "bg-primary"}`} />
                    )}
                    {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {open && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                        {item.children!.map((child) => (
                            <Link
                                key={child.url}
                                to={child.url}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    location.pathname === child.url
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                )}
                            >
                                <child.icon className="w-3.5 h-3.5" />
                                {child.title}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            to={item.url}
            title={collapsed ? item.title : undefined}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative group",
                isActive
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
        >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="flex-1">{item.title}</span>}
            {!collapsed && item.badge && (
                <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${item.badgeColor || "bg-primary"}`}>
                    {item.badge}
                </span>
            )}
            {collapsed && item.badge && (
                <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${item.badgeColor || "bg-primary"}`} />
            )}
            {/* Tooltip for collapsed */}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover border text-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.title}
                </div>
            )}
        </Link>
    );
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
    const { isAdmin, loading, role } = useAdmin();
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";
    const roleLabel = role?.replace(/_/g, " ") || "Administrator";

    useEffect(() => {
        if (!loading && !isAdmin) {
            toast.error("Unauthorized access to Admin Panel");
            navigate("/dashboard");
        }
    }, [isAdmin, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
        <div
            className={cn(
                "flex flex-col h-full bg-card border-r border-border",
                collapsed && !mobile ? "w-[68px]" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-4 border-b border-border shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-md">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                {(!collapsed || mobile) && (
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground leading-none">UteelPay</p>
                        <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-0.5">
                            Admin Portal
                        </p>
                    </div>
                )}
                {!mobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-auto"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Role badge */}
            {(!collapsed || mobile) && (
                <div className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2 text-xs">
                        <ShieldCheck className="w-3 h-3 text-primary" />
                        <span className="text-muted-foreground capitalize">{roleLabel}</span>
                        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => (
                    <SidebarNavItem key={item.url} item={item} collapsed={collapsed && !mobile} />
                ))}
            </nav>

            {/* User footer */}
            <div className="p-3 border-t border-border">
                {(!collapsed || mobile) && (
                    <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-accent/30">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {displayName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{displayName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive w-full px-2 py-2 rounded-xl hover:bg-destructive/10 transition-all",
                        (collapsed && !mobile) && "justify-center"
                    )}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {(!collapsed || mobile) && <span>Sign Out</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex w-full bg-background">
            {/* Desktop Sidebar */}
            <div className={cn("hidden md:flex shrink-0 h-screen sticky top-0", collapsed ? "w-[68px]" : "w-64")}>
                <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-64 z-50">
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 flex items-center gap-4 border-b border-border px-4 md:px-6 bg-card/80 backdrop-blur-md sticky top-0 z-40">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                        {/* Live indicator */}
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            System Online
                        </div>

                        {/* Alerts */}
                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                        </Button>

                        {/* User avatar */}
                        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                                {displayName[0]?.toUpperCase()}
                            </div>
                            <div className="text-xs hidden md:block">
                                <p className="font-semibold leading-none">{displayName}</p>
                                <p className="text-muted-foreground mt-0.5 capitalize">{roleLabel}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
