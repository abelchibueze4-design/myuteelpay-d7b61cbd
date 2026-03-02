import { ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Receipt,
    Settings,
    ShieldCheck,
    Bell,
    Search,
    LogOut,
    Package,
    BarChart3,
    Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { useEffect } from "react";

const adminMenuItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "User Management", url: "/admin/users", icon: Users },
    { title: "Transactions", url: "/admin/transactions", icon: Receipt },
    { title: "Service Management", url: "/admin/services", icon: Package },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Audit Logs", url: "/admin/logs", icon: ShieldCheck },
    { title: "Settings", url: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const { signOut, user } = useAuth();
    const { role } = useAdmin();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    const displayName = user?.user_metadata?.full_name || "Admin";

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-slate-900 text-slate-100">
            <SidebarContent className="flex flex-col h-full">
                {/* Admin Logo */}
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-white leading-none">Uteel Admin</span>
                            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-1">
                                {role?.replace("_", " ") || "Administrator"}
                            </span>
                        </div>
                    )}
                </div>

                <SidebarGroup className="mt-4">
                    <SidebarGroupLabel className="text-slate-400 px-6 text-[10px] font-bold uppercase tracking-widest">
                        Main Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminMenuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            to={item.url}
                                            className="flex items-center gap-3 px-6 py-3 hover:bg-slate-800 transition-colors group"
                                        >
                                            <item.icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                            {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <div className="mt-auto p-4 border-t border-slate-800">
                    {!collapsed && (
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold ring-2 ring-primary/20">
                                {displayName[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-xs text-slate-400 hover:text-white w-full px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all group"
                    >
                        <LogOut className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </SidebarContent>
        </Sidebar>
    );
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
    const { isAdmin, loading } = useAdmin();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAdmin) {
            toast.error("Unauthorized access to Admin Panel");
            navigate("/dashboard");
        }
    }, [isAdmin, loading, navigate]);

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
    if (!isAdmin) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-slate-950 text-slate-100">
                <AdminSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-16 flex items-center justify-between border-b border-slate-800 px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger>
                                <Menu className="h-5 w-5 text-slate-400" />
                            </SidebarTrigger>
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    placeholder="Global search..."
                                    className="pl-9 bg-slate-800/50 border-slate-700 w-64 text-sm focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-slate-900" />
                            </Button>
                            <div className="h-8 w-px bg-slate-800" />
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-white">System Status</p>
                                    <p className="text-[10px] text-green-500 flex items-center justify-end gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 p-6 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default AdminLayout;
