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
        <Sidebar collapsible="icon" className="border-r border-sidebar-border hover:bg-sidebar-accent/50">
            <SidebarContent className="flex flex-col h-full">
                {/* Admin Logo */}
                <div className="p-4 flex items-center gap-2">
                    {!collapsed && <span className="text-xl font-bold text-gradient">Uteelpay Admin</span>}
                    {collapsed && <span className="text-xl font-bold text-gradient">U</span>}
                    {!collapsed && (
                        <span className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-1 ml-2">
                            {role?.replace("_", " ") || "Admin"}
                        </span>
                    )}
                </div>

                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminMenuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            to={item.url}
                                            className="hover:bg-sidebar-accent/50 transition-colors group flex items-center gap-3 px-6 py-2"
                                        >
                                            <item.icon className="w-4 h-4 mr-2" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </Link>
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
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50"
                    >
                        <LogOut className="w-4 h-4" />
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

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;
    if (!isAdmin) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AdminSidebar />
                <div className="flex-1 flex flex-col min-w-0 bg-secondary">
                    <header className="h-14 flex items-center justify-between border-b px-4 bg-background z-10">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger>
                                <Menu className="h-5 w-5" />
                            </SidebarTrigger>
                            <span className="text-lg font-bold text-gradient hidden md:block">Admin Portal</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="relative hover:bg-accent hover:text-accent-foreground">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                            </Button>
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default AdminLayout;
