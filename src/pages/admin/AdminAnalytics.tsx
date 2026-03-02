import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"];

const AdminAnalytics = () => {
    const { data: transactions } = useAdminTransactions();

    // Pie Chart Data (Service Distribution)
    const serviceDistribution = transactions?.reduce((acc: any, t) => {
        const type = t.type.replace("_", " ");
        const existing = acc.find((item: any) => item.name === type);
        if (existing) existing.value++;
        else acc.push({ name: type, value: 1 });
        return acc;
    }, []) || [];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
                <p className="text-sm text-slate-400">Deep dive into service usage and revenue distributions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Service Distribution (Pie) */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
                    <h3 className="font-bold text-lg text-white mb-8">Service Distribution</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={serviceDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {serviceDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#f1f5f9" }}
                                    itemStyle={{ color: "#f1f5f9" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {serviceDistribution.map((item: any, index: number) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs text-slate-400">{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth Chart (Mock) */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
                    <h3 className="font-bold text-lg text-white mb-8">User Growth</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                                { name: "Week 1", users: 120 },
                                { name: "Week 2", users: 240 },
                                { name: "Week 3", users: 480 },
                                { name: "Week 4", users: 800 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", color: "#f1f5f9" }} />
                                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
