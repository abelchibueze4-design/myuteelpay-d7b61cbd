import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    GitBranch, Users, DollarSign, CheckCircle2, Clock, Download, Settings,
} from "lucide-react";
import { toast } from "sonner";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ReferralCommission = () => {
    const { data: referrals, isLoading } = useQuery({
        queryKey: ["adminReferrals"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("referred_users")
                .select(`
                    id,
                    reward_amount,
                    is_claimed,
                    created_at,
                    referrer:profiles!referred_users_referrer_id_fkey(full_name, username)
                `);
            if (error) throw error;

            // Group by referrer
            const grouped = (data || []).reduce((acc: any, curr: any) => {
                const ref = curr.referrer;
                const name = ref?.full_name || "Unknown";
                if (!acc[name]) {
                    acc[name] = {
                        name,
                        handle: ref?.username || "---",
                        referees: 0,
                        earnings: 0,
                        paid: 0,
                        pending: 0
                    };
                }
                acc[name].referees++;
                acc[name].earnings += curr.reward_amount || 10;
                if (curr.is_claimed) acc[name].paid += curr.reward_amount || 10;
                else acc[name].pending += curr.reward_amount || 10;
                return acc;
            }, {});

            return Object.values(grouped);
        }
    });

    const [commissionRate, setCommissionRate] = useState("10"); // Match actual default
    const [editRate, setEditRate] = useState(false);
    const [newRate, setNewRate] = useState("10");

    const typedReferrals = (referrals as any[]) || [];
    const totalEarnings = typedReferrals.reduce((a, r) => a + r.earnings, 0);
    const totalPaid = typedReferrals.reduce((a, r) => a + r.paid, 0);
    const totalPending = typedReferrals.reduce((a, r) => a + r.pending, 0);
    const totalReferees = typedReferrals.reduce((a, r) => a + r.referees, 0);

    const exportCSV = () => {
        const rows = [
            ["Referrer", "Handle", "Referees", "Total Earnings", "Paid", "Pending", "Status"],
            ...typedReferrals.map((r) => [r.name, r.handle, r.referees, r.earnings, r.paid, r.pending, r.pending === 0 ? "PAID" : "PENDING"]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "referrals.csv"; a.click();
        toast.success("Exported referrals.csv");
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Referral & Commission"
                description="Track referral trees, control commission rates, and approve payouts"
                icon={GitBranch}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                        </Button>
                    </div>
                }
            />

            {/* Commission Rate Control */}
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-base">Commission Rate Per Referral</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Current flat-rate payout per successful referral signup</p>
                </div>
                {editRate ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">₦</span>
                        <Input value={newRate} onChange={(e) => setNewRate(e.target.value)} className="w-28" type="number" />
                        <Button size="sm" onClick={() => { setCommissionRate(newRate); setEditRate(false); toast.success("Commission rate updated to ₦" + newRate); }}>
                            Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditRate(false)}>Cancel</Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <p className="text-3xl font-extrabold text-primary">₦{parseInt(commissionRate).toLocaleString()}</p>
                        <Button variant="outline" size="sm" onClick={() => setEditRate(true)}>
                            <Settings className="w-3.5 h-3.5 mr-1.5" /> Edit Rate
                        </Button>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Total Referees" value={totalReferees.toLocaleString()} icon={Users} iconColor="text-blue-500" iconBg="bg-blue-500/10" />
                <StatCard label="Total Commissions" value={`₦${totalEarnings.toLocaleString()}`} icon={DollarSign} highlight />
                <StatCard label="Paid Out" value={`₦${totalPaid.toLocaleString()}`} icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-500/10" />
                <StatCard label="Pending Payout" value={`₦${totalPending.toLocaleString()}`} icon={Clock} iconColor="text-amber-500" iconBg="bg-amber-500/10" />
            </div>

            {/* Referrals Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-semibold text-xs uppercase">Referrer</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Referees</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-right">Total Earned</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-right">Paid</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-right">Pending</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {typedReferrals.map((r, i) => (
                            <TableRow key={i} className="border-border hover:bg-accent/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {r.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{r.name}</p>
                                            <p className="text-[10px] text-muted-foreground">@{r.handle}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                        <Users className="w-3.5 h-3.5 text-muted-foreground" /> {r.referees}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm">₦{r.earnings.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-sm text-emerald-600 font-medium">₦{r.paid.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-sm text-amber-600 font-medium">₦{r.pending.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        r.pending === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                                            : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                                    }>
                                        {r.pending === 0 ? "PAID" : "PENDING"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {r.pending > 0 && (
                                        <Button
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => toast.info("User must claim this from their dashboard.")}
                                        >
                                            View Details
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ReferralCommission;
