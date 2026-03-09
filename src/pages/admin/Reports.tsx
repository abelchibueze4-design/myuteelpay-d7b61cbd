import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { DateRangeExport } from "@/components/admin/DateRangeExport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText, Download, TrendingUp, Wallet, Calendar, CheckCircle2,
} from "lucide-react";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useUsers } from "@/hooks/useUsers";
import { format, startOfMonth, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { exportToCSV, printPDF } from "@/utils/exportUtils";

const Reports = () => {
    const { data: transactions } = useAdminTransactions();
    const { data: users } = useUsers();

    const allTx = transactions ?? [];
    const successful = allTx.filter((t) => t.status === "success");
    const thisMonthStart = startOfMonth(new Date());
    const monthlySuccessful = successful.filter((t) => isAfter(new Date(t.created_at), thisMonthStart));

    const totalRevenue = successful.reduce((a, t) => a + Math.abs(t.amount), 0);
    const monthlyRevenue = monthlySuccessful.reduce((a, t) => a + Math.abs(t.amount), 0);
    const successRate = allTx.length
        ? ((successful.length / allTx.length) * 100).toFixed(1)
        : "0";

    // Build service revenue from real transaction data
    const serviceRevenue = allTx.reduce((acc: Record<string, { txns: number; volume: number }>, t) => {
        if (t.status !== "success") return acc;
        const name = t.type?.replace(/_/g, " ") || "Other";
        if (!acc[name]) acc[name] = { txns: 0, volume: 0 };
        acc[name].txns++;
        acc[name].volume += Math.abs(t.amount);
        return acc;
    }, {});

    const serviceRows = Object.entries(serviceRevenue)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b.volume - a.volume);

    const reportItems = [
        {
            title: "Financial Summary",
            description: "Complete income and transaction breakdown for all time",
            type: "CSV",
            date: format(new Date(), "MMM d, yyyy"),
        },
        {
            title: "Monthly Revenue Report",
            description: "Detailed breakdown of this month's transactions by service",
            type: "CSV",
            date: format(startOfMonth(new Date()), "MMMM yyyy"),
        },
        {
            title: "User Activity Report",
            description: "User sign-ups, active status, and wallet balances",
            type: "CSV",
            date: format(new Date(), "MMM d, yyyy"),
        },
    ];

    const handleDownload = (report: any) => {
        if (report.title === "Financial Summary") {
            const headers = ["ID", "Reference", "User", "Type", "Amount", "Status", "Date"];
            const data = allTx.map(t => [
                t.id, t.reference || 'N/A', t.user_name, t.type, t.amount, t.status, t.created_at
            ]);
            exportToCSV(headers, data, "financial_summary");
            toast.success("Financial Summary exported");
        }
        else if (report.title === "User Activity Report") {
            const headers = ["ID", "Name", "Username", "Email", "Balance", "Status", "Joined"];
            const data = (users ?? []).map(u => [
                u.id, u.full_name, u.username, u.email, u.wallet_balance, u.status, u.created_at
            ]);
            exportToCSV(headers, data, "user_activity_report");
            toast.success("User Activity Report exported");
        }
        else if (report.title === "Monthly Revenue Report") {
            const headers = ["Service", "Transactions", "Volume"];
            const data = serviceRows.map(([name, s]: [string, any]) => [
                name, s.txns.toString(), `N${s.volume.toLocaleString()}`
            ]);
            exportToCSV(headers, data, "monthly_revenue_report");
            toast.success("Monthly Revenue Report exported");
        }
    };

    const generatePDF = () => {
        const headers = ["Section", "Stat", "Value"];
        const data = [
            ["Financials", "Total Revenue", `N${totalRevenue.toLocaleString()}`],
            ["Financials", "Monthly Revenue", `N${monthlyRevenue.toLocaleString()}`],
            ["Platform", "Total Users", (users?.length ?? 0).toString()],
            ["Platform", "Success Rate", `${successRate}%`],
            ["Operations", "Successful Txns", successful.length.toString()],
        ];
        printPDF("Monthly Platform Operations Report", headers, data);
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Reports"
                description="Financial summaries and data exports based on real platform activity"
                icon={FileText}
                actions={
                    <DateRangeExport
                        reportTitle="Platform Operations Report"
                        headers={["Reference", "User", "Type", "Amount", "Status", "Date"]}
                        getFilteredData={(from, to) => {
                            const rows = allTx.filter((t) => {
                                const d = new Date(t.created_at);
                                const mf = !from || !isBefore(d, startOfDay(from));
                                const mt = !to || !isAfter(d, endOfDay(to));
                                return mf && mt;
                            });
                            return rows.map((t) => [
                                t.reference || "N/A",
                                t.user_name,
                                t.type,
                                `₦${Math.abs(t.amount).toLocaleString()}`,
                                t.status,
                                format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
                            ]);
                        }}
                    />
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="All-Time Revenue"
                    value={`₦${totalRevenue.toLocaleString("en-NG")}`}
                    icon={Wallet}
                    highlight
                />
                <StatCard
                    label="This Month Revenue"
                    value={`₦${monthlyRevenue.toLocaleString("en-NG")}`}
                    icon={Calendar}
                    iconColor="text-blue-500"
                    iconBg="bg-blue-500/10"
                />
                <StatCard
                    label="Success Rate"
                    value={`${successRate}%`}
                    icon={CheckCircle2}
                    iconColor="text-emerald-500"
                    iconBg="bg-emerald-500/10"
                />
                <StatCard
                    label="Total Users"
                    value={(users?.length ?? 0).toLocaleString()}
                    icon={TrendingUp}
                    iconColor="text-amber-500"
                    iconBg="bg-amber-500/10"
                />
            </div>

            {/* Service Revenue Snapshot — from real data */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-base mb-4">Revenue Snapshot by Service</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase">Service</th>
                                <th className="py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase text-right">Transactions</th>
                                <th className="py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceRows.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-muted-foreground text-sm italic">
                                        No transaction data yet.
                                    </td>
                                </tr>
                            ) : serviceRows.map(([name, s]: [string, any]) => (
                                <tr key={name} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                                    <td className="py-3 pr-4 font-medium text-sm capitalize">{name}</td>
                                    <td className="py-3 pr-4 text-right text-muted-foreground text-sm">{s.txns}</td>
                                    <td className="py-3 text-right font-semibold text-sm">₦{s.volume.toLocaleString("en-NG")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Downloadable Reports */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="mb-6">
                    <h3 className="font-bold text-base">Available Reports</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">On-demand report exports from real data</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportItems.map((report) => (
                        <div
                            key={report.title}
                            className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group"
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                    <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{report.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{report.description}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge variant="secondary" className="text-[9px] px-1.5">{report.type}</Badge>
                                        <span className="text-[10px] text-muted-foreground">{report.date}</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors"
                                onClick={() => handleDownload(report)}
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reports;
