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

const mockReferrals = [
    { id: "1", referrer: "John Doe", handle: "johndoe", referees: 12, earnings: 3600, paid: 2400, pending: 1200, status: "active" },
    { id: "2", referrer: "Mary Ade", handle: "marya", referees: 8, earnings: 2400, paid: 2400, pending: 0, status: "paid" },
    { id: "3", referrer: "Emeka Obi", handle: "emeka", referees: 5, earnings: 1500, paid: 0, pending: 1500, status: "pending" },
    { id: "4", referrer: "Fatima B.", handle: "fatimab", referees: 20, earnings: 6000, paid: 4000, pending: 2000, status: "active" },
];

const ReferralCommission = () => {
    const [commissionRate, setCommissionRate] = useState("300");
    const [editRate, setEditRate] = useState(false);
    const [newRate, setNewRate] = useState("300");

    const totalEarnings = mockReferrals.reduce((a, r) => a + r.earnings, 0);
    const totalPaid = mockReferrals.reduce((a, r) => a + r.paid, 0);
    const totalPending = mockReferrals.reduce((a, r) => a + r.pending, 0);
    const totalReferees = mockReferrals.reduce((a, r) => a + r.referees, 0);

    const exportCSV = () => {
        const rows = [
            ["Referrer", "Handle", "Referees", "Total Earnings", "Paid", "Pending", "Status"],
            ...mockReferrals.map((r) => [r.referrer, r.handle, r.referees, r.earnings, r.paid, r.pending, r.status]),
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
                        {mockReferrals.map((r) => (
                            <TableRow key={r.id} className="border-border hover:bg-accent/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {r.referrer[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{r.referrer}</p>
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
                                        r.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                                            : r.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                                                : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                                    }>
                                        {r.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {r.pending > 0 && (
                                        <Button
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => toast.success(`Approved ₦${r.pending.toLocaleString()} payout for @${r.handle}`)}
                                        >
                                            Approve ₦{r.pending.toLocaleString()}
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
