import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useUsers } from "@/hooks/useUsers";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
    Users, Wallet, TrendingUp, Activity, AlertTriangle,
    CheckCircle, XCircle, Clock, LayoutDashboard, ArrowRight,
    Download, RefreshCw,
} from "lucide-react";
import { format, subDays, isSameDay, startOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { exportToCSV, printPDF } from "@/utils/exportUtils";

const CHART_COLORS = ["#7C3AED", "#D4AF37", "#10b981", "#3b82f6", "#ef4444"];

const AdminDashboard = () => {
    const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = useUsers();
    const { data: transactions, isLoading: loadingTx, refetch: refetchTx } = useAdminTransactions();

    const totalUsers = users?.length ?? 0;
    const activeUsers = users?.filter((u) => u.status === "active").length ?? 0;
    const totalWalletBalance = users?.reduce((acc, u) => acc + (u.wallet_balance ?? 0), 0) ?? 0;

    const successful = transactions?.filter((t) => t.status === "success") ?? [];
    const failed = transactions?.filter((t) => t.status === "failed") ?? [];
    const pending = transactions?.filter((t) => t.status === "pending") ?? [];
    const totalRevenue = successful.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const successRate = transactions?.length ? ((successful.length / transactions.length) * 100).toFixed(1) : "0";

    // Today's revenue
    const todayRevenue = successful
        .filter((t) => isSameDay(new Date(t.created_at), new Date()))
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    // Weekly chart data (14 days for richer chart)
    const chartData = Array.from({ length: 14 }).map((_, i) => {
        const date = subDays(new Date(), 13 - i);
        const dayTx = successful.filter((t) => isSameDay(new Date(t.created_at), date));
        return {
            name: format(date, "MMM d"),
            revenue: dayTx.reduce((acc, t) => acc + Math.abs(t.amount), 0),
            count: dayTx.length,
        };
    });

    // Service breakdown
    const serviceBreakdown = transactions?.reduce((acc: any[], t) => {
        const key = t.type?.replace(/_/g, " ") || "Other";
        const found = acc.find((a) => a.name === key);
        if (found) { found.value++; found.revenue += Math.abs(t.amount); }
        else acc.push({ name: key, value: 1, revenue: Math.abs(t.amount) });
        return acc;
    }, []) ?? [];

    const topServices = [...serviceBreakdown].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Recent transactions
    const recentTx = (transactions ?? []).slice(0, 8);

    const handleExport = (type: "csv" | "pdf") => {
        const headers = ["Metric", "Value"];
        const data = [
            ["Total Revenue", `N${totalRevenue.toLocaleString()}`],
            ["Today's Revenue", `N${todayRevenue.toLocaleString()}`],
            ["Total Users", totalUsers.toLocaleString()],
            ["Active Users", activeUsers.toLocaleString()],
            ["Success Rate", `${successRate}%`],
            ["Successful Txns", successful.length.toString()],
            ["Failed Txns", failed.length.toString()],
            ["Floating Balance", `N${totalWalletBalance.toLocaleString()}`]
        ];

        if (type === "csv") {
            exportToCSV(headers, data, "admin_dashboard_summary");
            toast.success("Summary exported to CSV");
        } else {
            printPDF("Platform Executive Summary", headers, data);
            toast.success("PDF summary generated");
        }
    };

    if (loadingUsers || loadingTx) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-screen-2xl">
            <PageHeader
                title="Executive Dashboard"
                description="Real-time platform overview and financial metrics"
                icon={LayoutDashboard}
                badge="Live"
                badgeVariant="default"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { refetchUsers(); refetchTx(); toast.success("Dashboard refreshed"); }}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm">
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport("csv")}>
                                    Export Summary (CSV)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                    Export Summary (PDF)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            {/* Risk Alert Banner */}
            {failed.length > 5 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                        {failed.length} failed transactions detected. <Link to="/admin/transactions" className="underline font-bold">Review now.</Link>
                    </p>
                </div>
            )}

            {/* Primary KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="Total Revenue"
                    value={`₦${totalRevenue.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`}
                    sub={`₦${todayRevenue.toLocaleString("en-NG", { minimumFractionDigits: 0 })} today`}
                    icon={Wallet}
                    highlight
                />
                <StatCard
                    label="Total Users"
                    value={totalUsers.toLocaleString()}
                    sub={`${activeUsers} active now`}
                    icon={Users}
                    iconColor="text-blue-500"
                    iconBg="bg-blue-500/10"
                />
                <StatCard
                    label="Success Rate"
                    value={`${successRate}%`}
                    sub={`${successful.length} successful operations`}
                    icon={Activity}
                    iconColor="text-emerald-500"
                    iconBg="bg-emerald-500/10"
                />
                <StatCard
                    label="Floating Balance"
                    value={`₦${totalWalletBalance.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`}
                    sub="Sum of all user wallets"
                    icon={TrendingUp}
                    iconColor="text-amber-500"
                    iconBg="bg-amber-500/10"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Successful", value: successful.length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
                    { label: "Failed", value: failed.length, color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle },
                    { label: "Pending", value: pending.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock },
                    { label: "Alerts", value: failed.length, color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            <p className={`text-xs font-semibold uppercase tracking-wide ${s.color}`}>{s.label}</p>
                        </div>
                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Insights Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Trend Chart */}
                <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-base">Revenue Trend</h3>
                            <p className="text-xs text-muted-foreground">Last 14 days</p>
                        </div>
                    </div>
                    <div className="h-[260px]">
                        {chartData.some(d => d.revenue > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }}
                                        formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Revenue"]}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#areaGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                No revenue data for the last 14 days.
                            </div>
                        )}
                    </div>
                </div>

                {/* Service Distribution */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="mb-4">
                        <h3 className="font-bold text-base">Service Distribution</h3>
                        <p className="text-xs text-muted-foreground">By transaction count</p>
                    </div>
                    {topServices.length > 0 ? (
                        <div className="h-[200px] mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={topServices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} strokeWidth={2}>
                                        {topServices.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }}
                                        formatter={(v: any, name: string) => [v, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
                            No service data yet.
                        </div>
                    )}
                    <div className="space-y-2">
                        {topServices.slice(0, 4).map((s, i) => (
                            <div key={s.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    <span className="capitalize">{s.name}</span>
                                </div>
                                <span className="font-bold">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-card border border-border rounded-2xl">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h3 className="font-bold text-base">Recent Transactions</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Latest activity across all users</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/transactions">
                            View All <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTx.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm italic">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : recentTx.map((t) => (
                                <tr key={t.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {t.user_name?.[0]?.toUpperCase() ?? "?"}
                                            </div>
                                            <div>
                                                <p className="font-medium text-xs">{t.user_name}</p>
                                                <p className="text-[10px] text-muted-foreground">@{t.user_handle}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs capitalize text-muted-foreground">
                                        {t.type?.replace(/_/g, " ") ?? "—"}
                                    </td>
                                    <td className={`px-6 py-4 text-right text-xs font-bold ${t.amount < 0 ? "text-destructive" : "text-emerald-600"}`}>
                                        {t.amount < 0 ? "−" : "+"}₦{Math.abs(t.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            className={
                                                t.status === "success"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                    : t.status === "failed"
                                                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                                                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
                                            }
                                            variant="outline"
                                        >
                                            {t.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-muted-foreground">
                                        {format(new Date(t.created_at), "MMM d, h:mm a")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
