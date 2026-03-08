import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { DateRangeExport } from "@/components/admin/DateRangeExport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCw,
    AlertTriangle, TrendingUp, Receipt, Download,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useUsers } from "@/hooks/useUsers";
import { format, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { exportToCSV, printPDF } from "@/utils/exportUtils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WalletFinance = () => {
    const { data: transactions } = useAdminTransactions();
    const { data: users } = useUsers();
    const [refundDialog, setRefundDialog] = useState(false);
    const [refundRef, setRefundRef] = useState("");
    const [refundNote, setRefundNote] = useState("");

    const allTx = transactions ?? [];
    const successful = allTx.filter((t) => t.status === "success");

    const totalCredits = successful
        .filter((t) => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

    const totalDebits = successful
        .filter((t) => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const totalUserBalance = (users ?? []).reduce((acc, u) => acc + (u.wallet_balance ?? 0), 0);
    const netProfit = totalCredits - totalDebits;

    // Build service breakdown from real data
    const serviceBreakdown = successful.reduce((acc: Record<string, { count: number; volume: number }>, t) => {
        const name = t.type?.replace(/_/g, " ") || "Other";
        if (!acc[name]) acc[name] = { count: 0, volume: 0 };
        acc[name].count++;
        acc[name].volume += Math.abs(t.amount);
        return acc;
    }, {});

    const serviceRows = Object.entries(serviceBreakdown).sort(([, a]: [string, any], [, b]: [string, any]) => b.volume - a.volume);

    const recentLedger = allTx.slice(0, 10);

    const handleExport = (type: "csv" | "pdf") => {
        const headers = ["Service", "Transactions", "Volume"];
        const data = serviceRows.map(([name, s]: [string, any]) => [
            name, s.count.toString(), `N${s.volume.toLocaleString()}`
        ]);

        if (type === "csv") {
            exportToCSV(headers, data, "service_breakdown");
            toast.success("Service breakdown exported to CSV");
        } else {
            printPDF("Service Volume Report", headers, data);
            toast.success("PDF report generated");
        }
    };

    const handleLedgerExport = (type: "csv" | "pdf", from?: Date, to?: Date) => {
        const rows = allTx.filter((t) => {
            const d = new Date(t.created_at);
            const mf = !from || !isBefore(d, startOfDay(from));
            const mt = !to || !isAfter(d, endOfDay(to));
            return mf && mt;
        });
        const headers = ["Type", "User", "Debit", "Credit", "Status", "Date"];
        const data = rows.map((t) => [
            (t.type || "tx").replace(/_/g, " "),
            t.user_name,
            t.amount < 0 ? `₦${Math.abs(t.amount).toLocaleString()}` : "—",
            t.amount >= 0 ? `₦${t.amount.toLocaleString()}` : "—",
            t.status,
            format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
        ]);

        if (type === "csv") {
            exportToCSV(headers, data, "internal_ledger");
            toast.success("Ledger exported to CSV");
        } else {
            printPDF("Internal Ledger Report", headers, data);
            toast.success("PDF report generated");
        }
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Wallet & Finance Control"
                description="Internal ledger, profit tracking, and float monitoring"
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
            {totalUserBalance > totalCredits * 0.9 && totalCredits > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                        Float Warning: User wallet balances are approaching 90% of total revenue. Monitor provider float.
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Total Credits In" value={`₦${totalCredits.toLocaleString("en-NG")}`} icon={ArrowUpCircle} iconColor="text-emerald-500" iconBg="bg-emerald-500/10" />
                <StatCard label="Total Debits Out" value={`₦${totalDebits.toLocaleString("en-NG")}`} icon={ArrowDownCircle} iconColor="text-red-500" iconBg="bg-red-500/10" />
                <StatCard label="Net Movement" value={`₦${netProfit.toLocaleString("en-NG")}`} icon={TrendingUp} highlight />
                <StatCard label="Total User Float" value={`₦${totalUserBalance.toLocaleString("en-NG")}`} icon={Wallet} iconColor="text-blue-500" iconBg="bg-blue-500/10" />
            </div>

            {/* Service Volume Breakdown */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-base">Service Volume Breakdown</h3>
                        <p className="text-xs text-muted-foreground">Transaction volume per service type</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("pdf")}>Export as PDF/Print</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="space-y-3">
                    {serviceRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-6">No transaction data yet.</p>
                    ) : serviceRows.map(([name, s]: [string, any]) => (
                        <div key={name} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent/20 transition-colors">
                            <div className="flex-1">
                                <p className="font-semibold text-sm capitalize">{name}</p>
                                <p className="text-xs text-muted-foreground">{s.count} transactions</p>
                            </div>
                            <p className="text-sm font-bold text-emerald-600">₦{s.volume.toLocaleString("en-NG")}</p>
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
                                        <Badge variant="outline" className={t.status === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : t.status === "failed" ? "bg-red-50 text-red-700 border-red-200 text-[10px]" : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"}>
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
                        <Button onClick={async () => {
                            if (!refundRef.trim()) return toast.error("Enter a transaction reference");
                            // Find the transaction
                            const tx = allTx.find(t => t.reference === refundRef.trim() || t.id.startsWith(refundRef.trim()));
                            if (!tx) return toast.error("Transaction not found");
                            if (tx.status !== "success") return toast.error("Only successful transactions can be refunded");
                            if (tx.amount >= 0) return toast.error("Cannot refund a credit transaction");
                            
                            // Credit wallet
                            const { error: walletErr } = await supabase
                                .from("wallets")
                                .update({ balance: (users ?? []).find(u => u.id === tx.user_id)?.wallet_balance + Math.abs(tx.amount) } as any)
                                .eq("id", tx.user_id);
                            if (walletErr) return toast.error("Wallet update failed: " + walletErr.message);
                            
                            // Log refund transaction
                            await supabase.from("transactions").insert({
                                user_id: tx.user_id,
                                type: "refund" as any,
                                amount: Math.abs(tx.amount),
                                status: "success" as any,
                                description: refundNote || `Refund for ${tx.reference}`,
                                reference: `REFUND-${Date.now()}`,
                            });
                            
                            toast.success(`Refund of ₦${Math.abs(tx.amount).toLocaleString()} processed`);
                            setRefundDialog(false);
                            setRefundRef("");
                            setRefundNote("");
                        }}>
                            Confirm Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WalletFinance;
