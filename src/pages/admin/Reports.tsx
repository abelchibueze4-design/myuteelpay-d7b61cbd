import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText, Download, TrendingUp, Wallet, Calendar, CheckCircle2,
} from "lucide-react";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useUsers } from "@/hooks/useUsers";
import { format, startOfMonth, isAfter, startOfWeek } from "date-fns";
import { toast } from "sonner";

const Reports = () => {
    const { data: transactions } = useAdminTransactions();
    const { data: users } = useUsers();

    const successful = (transactions ?? []).filter((t) => t.status === "success");
    const thisMonthStart = startOfMonth(new Date());
    const monthlySuccessful = successful.filter((t) => isAfter(new Date(t.created_at), thisMonthStart));

    const totalRevenue = successful.reduce((a, t) => a + Math.abs(t.amount), 0);
    const monthlyRevenue = monthlySuccessful.reduce((a, t) => a + Math.abs(t.amount), 0);
    const successRate = (transactions ?? []).length
        ? ((successful.length / (transactions ?? []).length) * 100).toFixed(1)
        : "0";

    const reportItems = [
        {
            title: "Financial Summary",
            description: "Complete income, expenses, and net profit for all time",
            type: "CSV",
            date: format(new Date(), "MMM d, yyyy"),
            size: "~12KB",
        },
        {
            title: "Monthly Revenue Report",
            description: "Detailed breakdown of this month's transactions by service",
            type: "CSV",
            date: format(startOfMonth(new Date()), "MMMM yyyy"),
            size: "~8KB",
        },
        {
            title: "Profit Breakdown",
            description: "Profit margins per service with provider costs included",
            type: "PDF",
            date: format(new Date(), "MMM d, yyyy"),
            size: "~3MB",
        },
        {
            title: "User Activity Report",
            description: "User sign-ups, active sessions, KYC statuses",
            type: "CSV",
            date: format(new Date(), "MMM d, yyyy"),
            size: "~5KB",
        },
        {
            title: "Fraud & Security Report",
            description: "Flagged transactions, blocked IPs, failed logins",
            type: "PDF",
            date: format(new Date(), "MMM d, yyyy"),
            size: "~2MB",
        },
        {
            title: "Tax-Ready Export",
            description: "VAT-applicable transactions formatted for tax filing",
            type: "XLSX",
            date: format(new Date(), "MMM yyyy"),
            size: "~15KB",
        },
    ];

    const handleDownload = (title: string) => {
        toast.success(`"${title}" download started`);
    };

    const generatePDF = () => {
        toast.info("Generating monthly PDF report...");
        setTimeout(() => toast.success("Monthly PDF report ready for download!"), 2000);
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Reports"
                description="Financial summaries, profit breakdowns, and tax-ready data exports"
                icon={FileText}
                actions={
                    <Button size="sm" onClick={generatePDF}>
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Generate Monthly PDF
                    </Button>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="All-Time Revenue"
                    value={`₦${totalRevenue.toLocaleString("en-NG")}`}
                    icon={Wallet}
                    highlight
                    trend={12}
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
                    trend={2}
                />
                <StatCard
                    label="Total Users"
                    value={(users?.length ?? 0).toLocaleString()}
                    icon={TrendingUp}
                    iconColor="text-amber-500"
                    iconBg="bg-amber-500/10"
                    trend={8}
                />
            </div>

            {/* Service Revenue Snapshot */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-base mb-4">Revenue Snapshot by Service (This Month)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase">Service</th>
                                <th className="py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase text-right">Transactions</th>
                                <th className="py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase text-right">Volume</th>
                                <th className="py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Profit (est.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: "Airtime", txns: 340, volume: 1200000, margin: 2.5 },
                                { name: "Data Bundles", txns: 280, volume: 980000, margin: 5 },
                                { name: "Electricity", txns: 210, volume: 2100000, margin: 3 },
                                { name: "Cable TV", txns: 95, volume: 560000, margin: 4 },
                                { name: "Edu Pins", txns: 42, volume: 120000, margin: 6 },
                            ].map((s) => (
                                <tr key={s.name} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                                    <td className="py-3 pr-4 font-medium text-sm">{s.name}</td>
                                    <td className="py-3 pr-4 text-right text-muted-foreground text-sm">{s.txns}</td>
                                    <td className="py-3 pr-4 text-right font-semibold text-sm">₦{s.volume.toLocaleString("en-NG")}</td>
                                    <td className="py-3 text-right text-emerald-600 font-bold text-sm">
                                        ₦{((s.volume * s.margin) / 100).toLocaleString("en-NG")}
                                    </td>
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
                    <p className="text-xs text-muted-foreground mt-0.5">Pre-generated and on-demand report exports</p>
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
                                        <span className="text-[10px] text-muted-foreground">{report.size}</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors"
                                onClick={() => handleDownload(report.title)}
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
