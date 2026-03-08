import { useState } from "react";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { PageHeader } from "@/components/admin/PageHeader";
import { DateRangeExport } from "@/components/admin/DateRangeExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Receipt, Search, Download, MoreVertical, RefreshCw,
    CheckCircle2, XCircle, Clock, AlertTriangle, Eye,
    ArrowLeftRight, Flag,
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay, parseISO } from "date-fns";
import { toast } from "sonner";

const StatusBadge = ({ status }: { status: string }) => {
    if (status === "success") return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1"><CheckCircle2 className="w-3 h-3" /> Success</Badge>;
    if (status === "failed") return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
};

const TransactionMonitoring = () => {
    const { data: transactions, isLoading, error, refetch } = useAdminTransactions();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [flagged, setFlagged] = useState<Set<string>>(new Set());

    const types = [...new Set((transactions ?? []).map((t) => t.type))];

    const filtered = (transactions ?? []).filter((t) => {
        const s = search.toLowerCase();
        const matchSearch = !search
            || t.reference?.toLowerCase().includes(s)
            || t.user_name?.toLowerCase().includes(s)
            || t.description?.toLowerCase().includes(s);
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        const matchType = typeFilter === "all" || t.type === typeFilter;
        return matchSearch && matchStatus && matchType;
    });

    const handleExport = (type: "csv" | "pdf") => {
        const headers = ["Reference", "User", "Type", "Amount", "Status", "Date"];
        const data = filtered.map((t) => [
            t.reference || t.id.split("-")[0].toUpperCase(),
            t.user_name,
            t.type?.replace(/_/g, " "),
            `N${Math.abs(t.amount).toLocaleString()}`,
            t.status,
            format(new Date(t.created_at), "yyyy-MM-dd HH:mm")
        ]);

        if (type === "csv") {
            exportToCSV(headers, data, "transactions_report");
            toast.success("Transactions exported to CSV");
        } else {
            printPDF("Transaction Audit Report", headers, data);
            toast.success("Print dialog opened for PDF report");
        }
    };

    const toggleFlag = (id: string) => {
        const next = new Set(flagged);
        if (next.has(id)) next.delete(id); else next.add(id);
        setFlagged(next);
        toast.success(next.has(id) ? "Transaction flagged as fraudulent" : "Flag removed");
    };

    return (
        <div className="max-w-screen-2xl space-y-6">
            <PageHeader
                title="Transaction Monitoring"
                description="Real-time transaction oversight with filter, retry, and fraud controls"
                icon={Receipt}
                badge={`${(transactions ?? []).length}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm">
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export Data
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport("csv")}>
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                    Export as PDF/Print
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Reference, user, description..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Service type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {types.map((t) => (
                            <SelectItem key={t} value={t} className="capitalize">{t?.replace(/_/g, " ")}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Reference</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">User</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Service</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide text-right">Amount</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Date</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-border">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <TableCell key={j}><div className="h-6 bg-accent rounded" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-destructive py-8">
                                    {(error as Error).message}
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12 italic">
                                    No transactions match your filters.
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((t) => (
                            <TableRow
                                key={t.id}
                                className={`border-border hover:bg-accent/20 transition-colors ${flagged.has(t.id) ? "bg-red-50" : ""}`}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        {flagged.has(t.id) && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                                        <code className="text-[10px] font-mono text-muted-foreground">
                                            {t.reference || t.id.split("-")[0].toUpperCase()}
                                        </code>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                            {t.user_name?.[0]?.toUpperCase() ?? "?"}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium">{t.user_name}</p>
                                            <p className="text-[10px] text-muted-foreground">@{t.user_handle}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-xs capitalize text-muted-foreground">{t.type?.replace(/_/g, " ")}</p>
                                    {t.description && <p className="text-[10px] text-muted-foreground/60 line-clamp-1">{t.description}</p>}
                                </TableCell>
                                <TableCell className={`text-right text-sm font-bold ${t.amount < 0 ? "text-destructive" : "text-emerald-600"}`}>
                                    {t.amount < 0 ? "−" : "+"}₦{Math.abs(t.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell><StatusBadge status={t.status} /></TableCell>
                                <TableCell>
                                    <div className="text-[10px] text-muted-foreground">
                                        <p>{format(new Date(t.created_at), "MMM d, yyyy")}</p>
                                        <p>{format(new Date(t.created_at), "h:mm a")}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem onClick={() => setSelectedTx(t)}>
                                                <Eye className="w-4 h-4 mr-2" /> View Details
                                            </DropdownMenuItem>
                                            {t.status === "failed" && (
                                                <DropdownMenuItem onClick={() => toast.info("Retrying transaction...")}>
                                                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                                                </DropdownMenuItem>
                                            )}
                                            {t.status === "success" && (
                                                <DropdownMenuItem onClick={() => toast.info("Reversal request submitted")}>
                                                    <ArrowLeftRight className="w-4 h-4 mr-2" /> Reverse
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className={flagged.has(t.id) ? "text-muted-foreground" : "text-red-600 focus:text-red-600"}
                                                onClick={() => toggleFlag(t.id)}
                                            >
                                                <Flag className="w-4 h-4 mr-2" />
                                                {flagged.has(t.id) ? "Unflag" : "Flag Fraud"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Transaction Detail Dialog */}
            <Dialog open={!!selectedTx} onOpenChange={(o) => !o && setSelectedTx(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" /> Transaction Detail
                        </DialogTitle>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="space-y-3 pt-2 text-sm">
                            {[
                                ["Reference", selectedTx.reference || selectedTx.id],
                                ["User", `${selectedTx.user_name} (@${selectedTx.user_handle})`],
                                ["Service", selectedTx.type?.replace(/_/g, " ")],
                                ["Description", selectedTx.description || "N/A"],
                                ["Amount", `₦${Math.abs(selectedTx.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
                                ["Status", selectedTx.status],
                                ["Date", format(new Date(selectedTx.created_at), "PPpp")],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between border-b border-border/50 pb-2">
                                    <p className="text-muted-foreground text-xs">{k}</p>
                                    <p className="font-medium text-xs text-right max-w-[55%] capitalize">{v}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TransactionMonitoring;
