import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
    BarChart3, Download, TrendingUp, Wallet, Users, Activity,
    PieChart, Calendar,
} from "lucide-react";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useUsers } from "@/hooks/useUsers";
import { format, subDays, isSameDay, startOfMonth, isAfter } from "date-fns";

const COLORS = ["#7C3AED", "#D4AF37", "#10b981", "#3b82f6", "#ef4444"];

const AdminAnalytics = () => {
    const { data: transactions } = useAdminTransactions();
    const { data: users } = useUsers();

    const successful = (transactions ?? []).filter((t) => t.status === "success");

    // Monthly comparison (last 6 months)
    const monthlyData = Array.from({ length: 6 }).map((_, i) => {
        const monthDate = subDays(new Date(), (5 - i) * 30);
        return {
            name: format(monthDate, "MMM"),
            revenue: successful
                .filter((t) => {
                    const d = new Date(t.created_at);
                    return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
                })
                .reduce((acc, t) => acc + Math.abs(t.amount), 0),
        };
    });

    // Service distribution
    const serviceDistribution = (transactions ?? []).reduce((acc: any[], t) => {
        const name = t.type?.replace(/_/g, " ") || "Other";
        const found = acc.find((a) => a.name === name);
        if (found) { found.count++; found.revenue += Math.abs(t.amount); }
        else acc.push({ name, count: 1, revenue: Math.abs(t.amount) });
        return acc;
    }, []);

    // Weekly user growth (last 8 weeks)
    const weeklyUsers = Array.from({ length: 8 }).map((_, i) => {
        const weekStart = subDays(new Date(), (7 - i) * 7);
        const count = (users ?? []).filter((u) => {
            const d = new Date(u.created_at);
            return isAfter(d, subDays(weekStart, 7)) && !isAfter(d, weekStart);
        }).length;
        return { name: `W${i + 1}`, users: count };
    });

    const totalRevenue = successful.reduce((a, t) => a + Math.abs(t.amount), 0);
    const successRate = (transactions ?? []).length ? ((successful.length / (transactions ?? []).length) * 100).toFixed(1) : "0";

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Platform Analytics"
                description="Deep-dive revenue, service distribution, and user growth insights"
                icon={BarChart3}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Date Range
                        </Button>
                        <Button size="sm">
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Report
                        </Button>
                    </div>
                }
            />

            {/* Top Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Total Revenue" value={`₦${totalRevenue.toLocaleString("en-NG")}`} icon={Wallet} highlight />
                <StatCard label="Total Users" value={(users?.length ?? 0).toLocaleString()} icon={Users} iconColor="text-blue-500" iconBg="bg-blue-500/10" />
                <StatCard label="Success Rate" value={`${successRate}%`} icon={Activity} iconColor="text-emerald-500" iconBg="bg-emerald-500/10" />
                <StatCard label="Avg Revenue/User" value={`₦${users?.length ? Math.round(totalRevenue / users.length).toLocaleString() : 0}`} icon={TrendingUp} iconColor="text-amber-500" iconBg="bg-amber-500/10" />
            </div>

            {/* Monthly Revenue Bar Chart */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-base">Monthly Revenue</h3>
                        <p className="text-xs text-muted-foreground">Last 6 months comparison</p>
                    </div>
                    <Badge variant="secondary">6M</Badge>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }}
                                formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Revenue"]}
                            />
                            <Bar dataKey="revenue" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Service Breakdown + User Growth */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Service Breakdown */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="mb-6">
                        <h3 className="font-bold text-base">Service Revenue Breakdown</h3>
                        <p className="text-xs text-muted-foreground">By transaction type</p>
                    </div>
                    <div className="space-y-3">
                        {[...serviceDistribution].sort((a, b) => b.revenue - a.revenue).slice(0, 6).map((s, i) => {
                            const maxRev = Math.max(...serviceDistribution.map((x: any) => x.revenue), 1);
                            const pct = (s.revenue / maxRev) * 100;
                            return (
                                <div key={s.name}>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="font-medium capitalize">{s.name}</span>
                                        <span className="font-bold">₦{s.revenue.toLocaleString("en-NG")}</span>
                                    </div>
                                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                    </div>
                                </div>
                            );
                        })}
                        {serviceDistribution.length === 0 && (
                            <p className="text-sm text-muted-foreground italic text-center py-6">No transaction data yet.</p>
                        )}
                    </div>
                </div>

                {/* User Growth */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="mb-6">
                        <h3 className="font-bold text-base">User Growth</h3>
                        <p className="text-xs text-muted-foreground">New signups — last 8 weeks</p>
                    </div>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyUsers} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }}
                                />
                                <Line type="monotone" dataKey="users" stroke="#D4AF37" strokeWidth={2.5} dot={{ r: 4, fill: "#D4AF37", strokeWidth: 2, stroke: "#fff" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
