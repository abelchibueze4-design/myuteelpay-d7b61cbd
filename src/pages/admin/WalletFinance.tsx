import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCw,
    AlertTriangle, TrendingUp, Receipt, Edit, Download,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useUsers } from "@/hooks/useUsers";
import { format } from "date-fns";

const WalletFinance = () => {
    const { data: transactions } = useAdminTransactions();
    const { data: users } = useUsers();
    const [refundDialog, setRefundDialog] = useState(false);
    const [refundRef, setRefundRef] = useState("");
    const [refundNote, setRefundNote] = useState("");

    const totalRevenue = (transactions ?? [])
        .filter((t) => t.status === "success" && t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

    const totalDebits = (transactions ?? [])
        .filter((t) => t.status === "success" && t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const totalUserBalance = (users ?? []).reduce((acc, u) => acc + (u.wallet_balance ?? 0), 0);

    const netProfit = totalRevenue - totalDebits;

    const recentLedger = (transactions ?? []).slice(0, 10);

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Wallet & Finance Control"
                description="Internal ledger, refunds, profit tracking, and float monitoring"
                icon={Wallet}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toast.info("Reconciliation running...")}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reconcile
                        </Button>
                        <Button size="sm" onClick={() => setRefundDialog(true)}>
                            <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5" /> Process Refund
                        </Button>
                    </div>
                }
            />

            {/* Float Alert */}
            {totalUserBalance > totalRevenue * 0.9 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                        Float Warning: User wallet balances are approaching 90% of total revenue. Monitor provider float.
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Total Revenue In" value={`₦${totalRevenue.toLocaleString("en-NG")}`} icon={ArrowUpCircle} iconColor="text-emerald-500" iconBg="bg-emerald-500/10" trend={8} />
                <StatCard label="Total Debits Out" value={`₦${totalDebits.toLocaleString("en-NG")}`} icon={ArrowDownCircle} iconColor="text-red-500" iconBg="bg-red-500/10" />
                <StatCard label="Net Profit" value={`₦${netProfit.toLocaleString("en-NG")}`} icon={TrendingUp} highlight trend={5} />
                <StatCard label="Total User Float" value={`₦${totalUserBalance.toLocaleString("en-NG")}`} icon={Wallet} iconColor="text-blue-500" iconBg="bg-blue-500/10" />
            </div>

            {/* Profit Margin per Service */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-base">Service Profit Margins</h3>
                        <p className="text-xs text-muted-foreground">Estimated margin per service (editable)</p>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                    </Button>
                </div>
                <div className="space-y-3">
                    {[
                        { name: "Airtime", margin: "2.5%", volume: "₦1.2M", profit: "₦30K" },
                        { name: "Data Bundles", margin: "5%", volume: "₦980K", profit: "₦49K" },
                        { name: "Electricity", margin: "3%", volume: "₦2.1M", profit: "₦63K" },
                        { name: "Cable TV", margin: "4%", volume: "₦560K", profit: "₦22.4K" },
                        { name: "Education Pins", margin: "6%", volume: "₦120K", profit: "₦7.2K" },
                    ].map((s) => (
                        <div key={s.name} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent/20 transition-colors">
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{s.name}</p>
                                <p className="text-xs text-muted-foreground">Volume: {s.volume}</p>
                            </div>
                            <Badge variant="secondary" className="font-mono">{s.margin}</Badge>
                            <p className="text-sm font-bold text-emerald-600 w-20 text-right">{s.profit}</p>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Edit className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Internal Ledger */}
            <div className="bg-card border border-border rounded-2xl">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h3 className="font-bold text-base">Internal Ledger</h3>
                        <p className="text-xs text-muted-foreground">Recent financial movements</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Entry</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">User</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Debit</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Credit</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLedger.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-muted-foreground italic text-sm">No ledger entries.</td>
                                </tr>
                            ) : recentLedger.map((t) => (
                                <tr key={t.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            {t.amount < 0 ? (
                                                <ArrowUpCircle className="w-4 h-4 text-red-400" />
                                            ) : (
                                                <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                                            )}
                                            <span className="text-xs capitalize text-muted-foreground">{(t.type || "tx").replace(/_/g, " ")}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-xs">{t.user_name}</td>
                                    <td className="px-6 py-3 text-right text-xs font-medium text-red-500">
                                        {t.amount < 0 ? `₦${Math.abs(t.amount).toLocaleString("en-NG")}` : "—"}
                                    </td>
                                    <td className="px-6 py-3 text-right text-xs font-medium text-emerald-600">
                                        {t.amount >= 0 ? `₦${t.amount.toLocaleString("en-NG")}` : "—"}
                                    </td>
                                    <td className="px-6 py-3">
                                        <Badge variant="outline" className={t.status === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"}>
                                            {t.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3 text-[10px] text-muted-foreground">{format(new Date(t.created_at), "MMM d, h:mm a")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Refund Dialog */}
            <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" /> Process Refund
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Transaction Reference</label>
                            <Input placeholder="TXN-XXXXXXXX" value={refundRef} onChange={(e) => setRefundRef(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Refund Reason</label>
                            <Input placeholder="Reason for refund..." value={refundNote} onChange={(e) => setRefundNote(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundDialog(false)}>Cancel</Button>
                        <Button onClick={() => { toast.success("Refund processed successfully"); setRefundDialog(false); }}>
                            Confirm Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WalletFinance;
