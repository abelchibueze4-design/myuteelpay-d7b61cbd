import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import {
    Smartphone, Tv, Zap, MessageSquare, GraduationCap, Package,
    Wallet, Activity,
} from "lucide-react";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";

const SERVICE_ICONS: Record<string, any> = {
    airtime: Smartphone,
    data: Smartphone,
    cable_tv: Tv,
    electricity: Zap,
    bulk_sms: MessageSquare,
    edu_pin: GraduationCap,
    wallet_fund: Wallet,
    referral_bonus: Activity,
};

const ServiceManagement = () => {
    const { data: transactions, isLoading } = useAdminTransactions();

    const allTx = transactions ?? [];
    const successful = allTx.filter((t) => t.status === "success");

    // Build service stats from real transactions
    const serviceStats = allTx.reduce((acc: Record<string, { total: number; success: number; failed: number; volume: number }>, t) => {
        const type = t.type || "other";
        if (!acc[type]) acc[type] = { total: 0, success: 0, failed: 0, volume: 0 };
        acc[type].total++;
        if (t.status === "success") {
            acc[type].success++;
            acc[type].volume += Math.abs(t.amount);
        }
        if (t.status === "failed") acc[type].failed++;
        return acc;
    }, {});

    const serviceList = Object.entries(serviceStats)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b.volume - a.volume);

    const totalVolume = successful.reduce((a, t) => a + Math.abs(t.amount), 0);

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading services...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Service Overview"
                description="Transaction volume and success rates per service type"
                icon={Package}
            />

            {/* Summary */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                <StatCard label="Active Services" value={serviceList.length.toLocaleString()} icon={Package} iconColor="text-primary" iconBg="bg-primary/10" />
                <StatCard label="Total Volume" value={`₦${totalVolume.toLocaleString("en-NG")}`} icon={Wallet} highlight />
                <StatCard label="Total Transactions" value={allTx.length.toLocaleString()} icon={Activity} iconColor="text-blue-500" iconBg="bg-blue-500/10" />
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {serviceList.length === 0 ? (
                    <div className="col-span-full bg-card border border-border rounded-2xl p-12 text-center">
                        <p className="text-muted-foreground italic">No service data available yet.</p>
                    </div>
                ) : serviceList.map(([type, stats]: [string, any]) => {
                    const Icon = SERVICE_ICONS[type] || Activity;
                    const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : "0";
                    return (
                        <div
                            key={type}
                            className="bg-card border border-border rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 hover:border-primary/30"
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className="p-2.5 rounded-xl bg-primary/10">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]">
                                    {successRate}% success
                                </Badge>
                            </div>

                            <h3 className="font-bold text-base mb-0.5 capitalize">{type.replace(/_/g, " ")}</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                {stats.total} transactions · {stats.failed} failed
                            </p>

                            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-accent/40">
                                <span className="text-muted-foreground">Volume</span>
                                <span className="font-bold text-primary">₦{stats.volume.toLocaleString("en-NG")}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ServiceManagement;
