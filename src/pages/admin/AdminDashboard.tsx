import { useUsers } from "@/hooks/useUsers";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import {
    Users,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    AlertCircle,
} from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AdminDashboard = () => {
    const { data: users, isLoading: loadingUsers } = useUsers();
    const { data: transactions, isLoading: loadingTransactions } = useAdminTransactions();

    // Calculate Metrics
    const totalUsers = users?.length ?? 0;
    const activeUsers = users?.filter((u) => u.status === "active").length ?? 0;
    const totalBalance = users?.reduce((acc, u) => acc + (u.wallet_balance ?? 0), 0) ?? 0;

    const successfulTransactions = transactions?.filter((t) => t.status === "success") ?? [];
    const totalRevenue = successfulTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const failedCount = transactions?.filter((t) => t.status === "failed").length ?? 0;

    // Prepare Chart Data (Last 7 Days)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayTransactions = successfulTransactions.filter((t) =>
            isSameDay(new Date(t.created_at), date)
        );
        return {
            name: format(date, "MMM d"),
            amount: dayTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0),
            count: dayTransactions.length,
        };
    });

    const stats = [
        {
            label: "Total Users",
            value: totalUsers.toString(),
            trend: "+12%",
            trendUp: true,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Platform Revenue",
            value: `₦${totalRevenue.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`,
            trend: "+5.4%",
            trendUp: true,
            icon: Wallet,
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            label: "Success Rate",
            value: transactions?.length
                ? `${((successfulTransactions.length / transactions.length) * 100).toFixed(1)}%`
                : "0%",
            trend: "-0.5%",
            trendUp: false,
            icon: Activity,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            label: "System Alerts",
            value: failedCount.toString(),
            trend: "Recent failures",
            trendUp: false,
            icon: AlertCircle,
            color: "text-red-500",
            bg: "bg-red-500/10",
        },
    ];

    if (loadingUsers || loadingTransactions) {
        return <div className="p-8 text-center text-slate-400 animate-pulse">Calculating platform metrics...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
                <p className="text-sm text-slate-400">Real-time performance and system health metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${stat.trendUp ? "text-green-500" : "text-red-500"}`}>
                                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.trend}
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1 text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-lg text-white">Revenue Analysis (7D)</h3>
                        <Select defaultValue="revenue">
                            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 h-8 text-xs">
                                <SelectValue placeholder="Metric" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                <SelectItem value="revenue">Revenue</SelectItem>
                                <SelectItem value="transactions">Transactions</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9" }}
                                    formatter={(value: any) => [`₦${value.toLocaleString()}`, "Revenue"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity List (Mini) */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h3 className="font-bold text-lg text-white mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {successfulTransactions.slice(0, 5).map((t, i) => (
                            <div key={t.id} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                    <Activity className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{t.user_name} purchased {t.type.replace("_", " ")}</p>
                                    <p className="text-[10px] text-slate-500">{format(new Date(t.created_at), "h:mm aa, MMM d")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-widest gap-2">
                        View All Transactions <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;


