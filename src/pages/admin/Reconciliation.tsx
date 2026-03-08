import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { DateRangeExport } from "@/components/admin/DateRangeExport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
    RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock,
    Wallet, TrendingUp, TrendingDown, Activity, Scale,
    Eye, Flag, ShieldCheck, ArrowLeftRight, Download,
    Play, Filter, ChevronDown,
} from "lucide-react";
import {
    useReconciliationCases,
    useReconciliationReports,
    useTodayReport,
    useDailySummary,
    useUpdateCase,
    useTriggerReconciliation,
    useLogAdminAction,
    usePendingFailedTransactions,
    useForceResolveTransaction,
    useRefundFailedTransaction,
    useMarkTransactionFailed,
    ReconciliationCase,
} from "@/hooks/useReconciliation";
import { format, parseISO, formatDistanceToNow, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Issue type metadata ──────────────────────────────────────────────────────
const ISSUE_META: Record<string, { label: string; color: string; icon: any }> = {
    payment_not_delivered: { label: "Payment Not Delivered", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
    service_undeducted: { label: "Service Not Deducted", color: "text-orange-700 bg-orange-50 border-orange-200", icon: Wallet },
    duplicate: { label: "Duplicate Transaction", color: "text-amber-700 bg-amber-50 border-amber-200", icon: ArrowLeftRight },
    missing_webhook: { label: "Missing Webhook", color: "text-purple-700 bg-purple-50 border-purple-200", icon: Activity },
    profit_mismatch: { label: "Profit Mismatch", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Scale },
    wallet_mismatch: { label: "Wallet Mismatch", color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: Wallet },
};

const SEV_COLOR: Record<string, string> = {
    low: "bg-slate-100 text-slate-600 border-slate-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    critical: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_COLOR: Record<string, string> = {
    open: "bg-amber-50 text-amber-700 border-amber-300",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    escalated: "bg-orange-50 text-orange-700 border-orange-200",
    fraud: "bg-red-50 text-red-700 border-red-200",
    false_positive: "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const IssueBadge = ({ type }: { type: string }) => {
    const meta = ISSUE_META[type] ?? { label: type, color: "text-slate-600 bg-slate-100 border-slate-200", icon: AlertTriangle };
    const Icon = meta.icon;
    return (
        <Badge variant="outline" className={cn("text-[10px] gap-1 font-medium capitalize", meta.color)}>
            <Icon className="w-3 h-3" /> {meta.label}
        </Badge>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Reconciliation = () => {
    const [statusFilter, setStatusFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [selectedCase, setSelectedCase] = useState<ReconciliationCase | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [confirmAction, setConfirmAction] = useState<{ type: "resolve" | "refund" | "fail"; tx: any } | null>(null);

    const { data: cases, isLoading: loadingCases, refetch: refetchCases } = useReconciliationCases(statusFilter === "all" ? undefined : statusFilter);
    const { data: reports, isLoading: loadingReports } = useReconciliationReports(14);
    const { data: todayReport, isLoading: loadingToday } = useTodayReport();
    const { data: dailySummary } = useDailySummary(14);
    const { data: pendingFailedTxns, isLoading: loadingPF, refetch: refetchPF } = usePendingFailedTransactions();

    const updateCase = useUpdateCase();
    const triggerCron = useTriggerReconciliation();
    const logAction = useLogAdminAction();
    const forceResolve = useForceResolveTransaction();
    const refundTx = useRefundFailedTransaction();
    const markFailed = useMarkTransactionFailed();

    const filteredCases = (cases ?? []).filter((c) =>
        (severityFilter === "all" || c.severity === severityFilter)
    );

    const openCases = (cases ?? []).filter((c) => c.status === "open").length;
    const criticalCases = (cases ?? []).filter((c) => c.severity === "critical").length;
    const pendingCount = (pendingFailedTxns ?? []).filter((t: any) => t.status === "pending").length;
    const failedCount = (pendingFailedTxns ?? []).filter((t: any) => t.status === "failed").length;

    // Chart data from daily summary
    const chartData = ((dailySummary ?? []) as any[])
        .slice()
        .reverse()
        .map((d: any) => ({
            name: format(parseISO(d.txn_date), "MMM d"),
            deposits: Math.abs(Number(d.total_deposits) || 0),
            service: Math.abs(Number(d.total_service_spend) || 0),
            failureRate: Number(d.failure_rate_pct) || 0,
        }));

    // Report chart (profit variance trend)
    const profitChartData = ((reports ?? []) as any[])
        .slice()
        .reverse()
        .map((r: any) => ({
            name: format(parseISO(r.report_date), "MMM d"),
            expected: Number(r.expected_profit) || 0,
            actual: Number(r.actual_profit) || 0,
            variance: Number(r.profit_variance) || 0,
        }));

    const handleUpdateCase = async () => {
        if (!selectedCase) return;
        await updateCase.mutateAsync({
            id: selectedCase.id,
            status: newStatus || undefined,
            admin_notes: adminNote,
        });
        await logAction.mutateAsync({
            action: `${newStatus ? `Status changed to '${newStatus}'` : "Note added"} on reconciliation case ${selectedCase.id}`,
            target_type: "reconciliation",
            target_id: selectedCase.id,
            metadata: { old_status: selectedCase.status, new_status: newStatus, note: adminNote },
        });
        setSelectedCase(null);
        setAdminNote("");
        setNewStatus("");
    };

    const handleRetry = async (c: ReconciliationCase) => {
        toast.info(`Retrying transaction for case ${c.id.slice(0, 8)}...`);
        await logAction.mutateAsync({
            action: `Retry attempted for reconciliation case ${c.id}`,
            target_type: "reconciliation",
            target_id: c.id,
        });
    };

    const handleRunReconciliation = async () => {
        await triggerCron.mutateAsync(undefined);
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Reconciliation Center"
                description="Financial audit, mismatch detection, and automated nightly reconciliation"
                icon={Scale}
                badge={openCases > 0 ? `${openCases} open` : "Clean"}
                badgeVariant={openCases > 0 ? "destructive" : "secondary"}
                actions={
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => refetchCases()}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                        </Button>
                        <DateRangeExport
                            reportTitle="Reconciliation Cases Report"
                            headers={["ID", "Issue Type", "Severity", "Status", "Description", "Created"]}
                            getFilteredData={(from, to) => {
                                const rows = (cases ?? []).filter((c) => {
                                    const d = new Date(c.created_at);
                                    const mf = !from || !isBefore(d, startOfDay(from));
                                    const mt = !to || !isAfter(d, endOfDay(to));
                                    return mf && mt;
                                });
                                return rows.map((c) => [
                                    c.id.slice(0, 8),
                                    c.issue_type,
                                    c.severity,
                                    c.status,
                                    c.description,
                                    format(new Date(c.created_at), "yyyy-MM-dd HH:mm"),
                                ]);
                            }}
                            compact
                        />
                        <Button
                            size="sm"
                            onClick={handleRunReconciliation}
                            disabled={triggerCron.isPending}
                            className="gap-1.5"
                        >
                            {triggerCron.isPending ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5" />
                            )}
                            {triggerCron.isPending ? "Running..." : "Run Now"}
                        </Button>
                    </div>
                }
            />

            {/* Critical Alert Banner */}
            {criticalCases > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-pulse">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">
                        {criticalCases} critical reconciliation issue{criticalCases !== 1 ? "s" : ""} require immediate attention!
                    </p>
                    <Button size="sm" variant="destructive" className="ml-auto text-xs h-7 shrink-0" onClick={() => setSeverityFilter("critical")}>
                        View Critical
                    </Button>
                </div>
            )}

            {/* KPI Cards — Today's Report */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard
                    label="Today's Deposits"
                    value={`₦${(todayReport?.total_deposits ?? 0).toLocaleString("en-NG")}`}
                    icon={TrendingUp}
                    iconColor="text-emerald-500"
                    iconBg="bg-emerald-500/10"
                    sub={loadingToday ? "Loading..." : `${todayReport?.successful_txns ?? 0} txns`}
                />
                <StatCard
                    label="Service Cost"
                    value={`₦${(todayReport?.total_service_cost ?? 0).toLocaleString("en-NG")}`}
                    icon={Activity}
                    iconColor="text-blue-500"
                    iconBg="bg-blue-500/10"
                    sub={`${todayReport?.total_transactions ?? 0} total txns`}
                />
                <StatCard
                    label="Expected Profit"
                    value={`₦${(todayReport?.expected_profit ?? 0).toLocaleString("en-NG")}`}
                    icon={Wallet}
                    highlight
                    sub="3% platform fee"
                />
                <StatCard
                    label="Profit Variance"
                    value={`₦${Math.abs(todayReport?.profit_variance ?? 0).toLocaleString("en-NG")}`}
                    icon={todayReport?.profit_variance && todayReport.profit_variance > 0 ? TrendingDown : CheckCircle2}
                    iconColor={todayReport?.profit_variance && todayReport.profit_variance > 50 ? "text-red-500" : "text-emerald-500"}
                    iconBg={todayReport?.profit_variance && todayReport.profit_variance > 50 ? "bg-red-500/10" : "bg-emerald-500/10"}
                    sub={todayReport?.profit_variance && todayReport.profit_variance > 0 ? "Expected > Actual" : "On track"}
                />
                <StatCard
                    label="Open Mismatches"
                    value={String(todayReport?.mismatch_count ?? openCases)}
                    icon={AlertTriangle}
                    iconColor={openCases > 0 ? "text-red-500" : "text-emerald-500"}
                    iconBg={openCases > 0 ? "bg-red-500/10" : "bg-emerald-500/10"}
                    sub={`${todayReport?.failure_rate ?? 0}% failure rate`}
                />
            </div>

            {/* Secondary Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Duplicates Today", value: todayReport?.duplicate_count ?? 0, color: "text-red-600 bg-red-50 border-red-200" },
                    { label: "Missing Webhooks", value: todayReport?.missing_webhook_count ?? 0, color: "text-amber-600 bg-amber-50 border-amber-200" },
                    { label: "Successful Txns", value: todayReport?.successful_txns ?? 0, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                    { label: "Failed Txns", value: todayReport?.failed_txns ?? 0, color: "text-red-600 bg-red-50 border-red-200" },
                ].map((m) => (
                    <div key={m.label} className={`rounded-xl border p-4 ${m.color}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{m.label}</p>
                        <p className="text-2xl font-extrabold mt-1">{m.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Deposits vs Service Spend */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="mb-5">
                        <h3 className="font-bold text-base">Deposits vs Service Spend</h3>
                        <p className="text-xs text-muted-foreground">14-day comparison (₦)</p>
                    </div>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }}
                                    formatter={(v: any, n) => [`₦${Number(v).toLocaleString()}`, n === "deposits" ? "Deposits" : "Service Spend"]} />
                                <Bar dataKey="deposits" fill="#7C3AED" radius={[4, 4, 0, 0]} opacity={0.85} />
                                <Bar dataKey="service" fill="#D4AF37" radius={[4, 4, 0, 0]} opacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-primary" /> Deposits</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-[#D4AF37]" /> Service Spend</div>
                    </div>
                </div>

                {/* Profit Variance Trend */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="mb-5">
                        <h3 className="font-bold text-base">Profit Variance Trend</h3>
                        <p className="text-xs text-muted-foreground">Expected vs Actual profit (₦)</p>
                    </div>
                    {profitChartData.length === 0 ? (
                        <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm italic">
                            Run reconciliation to generate chart data.
                        </div>
                    ) : (
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={profitChartData} margin={{ left: -10 }}>
                                    <defs>
                                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.4} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }}
                                        formatter={(v: any, n) => [`₦${Number(v).toLocaleString()}`, n === "expected" ? "Expected" : "Actual"]} />
                                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                                    <Area type="monotone" dataKey="expected" stroke="#7C3AED" strokeWidth={2} fill="url(#expGrad)" />
                                    <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fill="url(#actGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {profitChartData.length > 0 && (
                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-primary" /> Expected</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Actual</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reconciliation Cases Audit Panel */}
            <div className="bg-card border border-border rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-border">
                    <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" /> Audit Panel
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            All detected reconciliation issues with full transaction timeline
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Status filter pills */}
                        {["all", "open", "resolved", "escalated", "fraud"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors",
                                    statusFilter === s
                                        ? "bg-primary text-white"
                                        : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger className="h-7 w-32 text-xs">
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severity</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="font-semibold text-xs uppercase w-36">Issue Type</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Description</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Expected</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Actual</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Variance</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Severity</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Detected</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingCases ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-border">
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <TableCell key={j}><div className="h-6 bg-accent rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredCases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground py-16 italic">
                                        {statusFilter === "all"
                                            ? "No reconciliation cases detected. System is clean ✅"
                                            : `No ${statusFilter} cases found.`}
                                    </TableCell>
                                </TableRow>
                            ) : filteredCases.map((c) => (
                                <TableRow
                                    key={c.id}
                                    className={cn(
                                        "border-border transition-colors",
                                        c.severity === "critical"
                                            ? "bg-red-50/40 hover:bg-red-50/70"
                                            : "hover:bg-accent/20"
                                    )}
                                >
                                    <TableCell><IssueBadge type={c.issue_type} /></TableCell>
                                    <TableCell className="max-w-[220px]">
                                        <p className="text-xs line-clamp-2">{c.description}</p>
                                        {c.reference && (
                                            <code className="text-[9px] font-mono text-muted-foreground">{c.reference}</code>
                                        )}
                                        {c.admin_notes && (
                                            <p className="text-[9px] text-blue-600 mt-0.5 italic line-clamp-1">Note: {c.admin_notes}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-medium text-emerald-600">
                                        {c.expected_amount != null ? `₦${c.expected_amount.toLocaleString("en-NG")}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-medium">
                                        {c.actual_amount != null ? `₦${c.actual_amount.toLocaleString("en-NG")}` : "—"}
                                    </TableCell>
                                    <TableCell className={cn("text-right text-xs font-bold",
                                        c.variance && c.variance > 0 ? "text-red-600" : c.variance && c.variance < 0 ? "text-amber-600" : "text-muted-foreground"
                                    )}>
                                        {c.variance != null ? (
                                            <>
                                                {c.variance > 0 ? "−" : c.variance < 0 ? "+" : ""}
                                                ₦{Math.abs(c.variance).toLocaleString("en-NG")}
                                            </>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("text-[10px]", SEV_COLOR[c.severity] ?? "")}>
                                            {c.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("text-[10px] capitalize", STATUS_COLOR[c.status] ?? "")}>
                                            {c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground">
                                        {format(new Date(c.created_at), "MMM d, h:mm a")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                title="Review case"
                                                onClick={() => { setSelectedCase(c); setAdminNote(c.admin_notes ?? ""); setNewStatus(c.status); }}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                            {["payment_not_delivered", "service_undeducted", "missing_webhook"].includes(c.issue_type) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                                                    title="Retry"
                                                    onClick={() => handleRetry(c)}
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ─── Pending / Failed Transactions Reconciliation Panel ─── */}
            <div className="bg-card border border-border rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-border">
                    <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" /> Pending &amp; Failed Transactions
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {pendingCount} pending · {failedCount} failed — take action to reconcile
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchPF()}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="font-semibold text-xs uppercase">User</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Type</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Amount</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Reference</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Age</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingPF ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-border">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><div className="h-6 bg-accent rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (pendingFailedTxns ?? []).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12 italic">
                                        No pending or failed transactions. All clear ✅
                                    </TableCell>
                                </TableRow>
                            ) : (pendingFailedTxns ?? []).map((tx: any) => (
                                <TableRow key={tx.id} className={cn("border-border", tx.status === "failed" ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-accent/20")}>
                                    <TableCell className="text-xs font-medium">{tx.user_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] capitalize">
                                            {tx.type?.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-bold">₦{Math.abs(tx.amount).toLocaleString("en-NG")}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("text-[10px]",
                                            tx.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-red-50 text-red-700 border-red-300"
                                        )}>
                                            {tx.status === "pending" ? <Clock className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-[10px] font-mono text-muted-foreground">{tx.reference?.slice(0, 16) || "—"}</code>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {tx.status === "pending" && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => setConfirmAction({ type: "resolve", tx })}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => setConfirmAction({ type: "fail", tx })}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 mr-1" /> Fail
                                                    </Button>
                                                </>
                                            )}
                                            {tx.status === "failed" && !(tx.metadata as any)?.admin_refunded && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => setConfirmAction({ type: "refund", tx })}
                                                >
                                                    <Wallet className="w-3.5 h-3.5 mr-1" /> Refund
                                                </Button>
                                            )}
                                            {tx.status === "failed" && (tx.metadata as any)?.admin_refunded && (
                                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    Refunded ✓
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Confirm Action Dialog for Pending/Failed Txns */}
            <Dialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {confirmAction?.type === "resolve" && <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Force Resolve Transaction</>}
                            {confirmAction?.type === "refund" && <><Wallet className="w-5 h-5 text-blue-600" /> Refund Failed Transaction</>}
                            {confirmAction?.type === "fail" && <><XCircle className="w-5 h-5 text-red-600" /> Mark as Failed</>}
                        </DialogTitle>
                    </DialogHeader>
                    {confirmAction && (
                        <div className="space-y-3 pt-1">
                            <div className="p-3 bg-accent/40 rounded-xl space-y-1 text-sm">
                                <p><span className="font-semibold">User:</span> {confirmAction.tx.user_name}</p>
                                <p><span className="font-semibold">Amount:</span> ₦{Math.abs(confirmAction.tx.amount).toLocaleString("en-NG")}</p>
                                <p><span className="font-semibold">Type:</span> {confirmAction.tx.type?.replace(/_/g, " ")}</p>
                                <p><span className="font-semibold">Reference:</span> <code className="text-xs">{confirmAction.tx.reference || "—"}</code></p>
                            </div>
                            {confirmAction.type === "resolve" && (
                                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                                    This will mark the transaction as <strong>successful</strong>. If it's a wallet funding, the user's wallet will be credited.
                                </p>
                            )}
                            {confirmAction.type === "refund" && (
                                <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg">
                                    This will credit <strong>₦{Math.abs(confirmAction.tx.amount).toLocaleString("en-NG")}</strong> back to the user's wallet and log a refund transaction.
                                </p>
                            )}
                            {confirmAction.type === "fail" && (
                                <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg">
                                    This will mark the pending transaction as <strong>failed</strong>. You can refund it afterwards if needed.
                                </p>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={forceResolve.isPending || refundTx.isPending || markFailed.isPending}
                            className={cn(
                                confirmAction?.type === "resolve" && "bg-emerald-600 hover:bg-emerald-700",
                                confirmAction?.type === "refund" && "bg-blue-600 hover:bg-blue-700",
                                confirmAction?.type === "fail" && "bg-red-600 hover:bg-red-700",
                            )}
                            onClick={async () => {
                                if (!confirmAction) return;
                                const tx = confirmAction.tx;
                                if (confirmAction.type === "resolve") {
                                    await forceResolve.mutateAsync({ txId: tx.id, userId: tx.user_id, amount: Math.abs(tx.amount) });
                                } else if (confirmAction.type === "refund") {
                                    await refundTx.mutateAsync({ txId: tx.id, userId: tx.user_id, amount: tx.amount, reference: tx.reference });
                                } else if (confirmAction.type === "fail") {
                                    await markFailed.mutateAsync({ txId: tx.id });
                                }
                                await logAction.mutateAsync({
                                    action: `Transaction ${confirmAction.type}: ${tx.reference || tx.id.slice(0, 8)}`,
                                    target_type: "transaction",
                                    target_id: tx.id,
                                    metadata: { type: confirmAction.type, amount: tx.amount, user_id: tx.user_id },
                                });
                                setConfirmAction(null);
                            }}
                        >
                            {(forceResolve.isPending || refundTx.isPending || markFailed.isPending) ? "Processing..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {(reports ?? []).length > 0 && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div>
                            <h3 className="font-bold text-base">Reconciliation History</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Daily reports generated by the cron</p>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="font-semibold text-xs uppercase">Date</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Deposits</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Expected</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Actual</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Variance</TableHead>
                                <TableHead className="font-semibold text-xs uppercase text-right">Failure%</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                                <TableHead className="font-semibold text-xs uppercase">Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(reports ?? []).map((r) => (
                                <TableRow key={r.id} className="border-border hover:bg-accent/20">
                                    <TableCell className="font-medium text-sm">
                                        {format(parseISO(r.report_date), "EEEE, MMM d yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-emerald-600 font-medium">
                                        ₦{(r.total_deposits ?? 0).toLocaleString("en-NG")}
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-medium">
                                        ₦{(r.expected_profit ?? 0).toLocaleString("en-NG")}
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-medium">
                                        ₦{(r.actual_profit ?? 0).toLocaleString("en-NG")}
                                    </TableCell>
                                    <TableCell className={cn("text-right text-sm font-bold",
                                        (r.profit_variance ?? 0) > 50 ? "text-red-600" : (r.profit_variance ?? 0) > 0 ? "text-amber-600" : "text-muted-foreground"
                                    )}>
                                        ₦{Math.abs(r.profit_variance ?? 0).toLocaleString("en-NG")}
                                    </TableCell>
                                    <TableCell className={cn("text-right text-sm font-bold", (r.failure_rate ?? 0) > 15 ? "text-red-600" : "text-muted-foreground")}>
                                        {(r.failure_rate ?? 0).toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            r.mismatch_count > 0
                                                ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                                        }>
                                            {r.mismatch_count > 0 ? `${r.mismatch_count} mismatches` : "Clean"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={r.email_sent ? "text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]" : "text-muted-foreground bg-accent text-[10px]"}>
                                            {r.email_sent ? "Sent ✓" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Case Review Dialog */}
            <Dialog open={!!selectedCase} onOpenChange={(o) => !o && setSelectedCase(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-primary" /> Reconciliation Case
                        </DialogTitle>
                    </DialogHeader>
                    {selectedCase && (
                        <div className="space-y-4 pt-1">
                            {/* Case summary */}
                            <div className="p-4 bg-accent/40 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <IssueBadge type={selectedCase.issue_type} />
                                    <Badge variant="outline" className={cn("text-[10px]", SEV_COLOR[selectedCase.severity])}>
                                        {selectedCase.severity}
                                    </Badge>
                                </div>
                                <p className="text-sm">{selectedCase.description}</p>
                                {selectedCase.reference && (
                                    <code className="text-[10px] font-mono text-muted-foreground">Ref: {selectedCase.reference}</code>
                                )}
                            </div>

                            {/* Financial details */}
                            {(selectedCase.expected_amount != null || selectedCase.actual_amount != null) && (
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Expected", value: selectedCase.expected_amount, color: "text-emerald-600" },
                                        { label: "Actual", value: selectedCase.actual_amount, color: "" },
                                        { label: "Variance", value: selectedCase.variance, color: selectedCase.variance && selectedCase.variance > 0 ? "text-red-600" : "text-muted-foreground" },
                                    ].map((f) => (
                                        <div key={f.label} className="text-center p-3 border border-border rounded-xl">
                                            <p className="text-[10px] text-muted-foreground mb-1">{f.label}</p>
                                            <p className={cn("text-sm font-bold", f.color)}>
                                                {f.value != null ? `₦${Math.abs(f.value).toLocaleString("en-NG")}` : "—"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="text-xs text-muted-foreground space-y-1 border-l-2 border-primary/30 pl-3">
                                <p>🔍 Detected: {format(new Date(selectedCase.created_at), "PPpp")}</p>
                                <p>🔄 Updated: {format(new Date(selectedCase.updated_at), "PPpp")}</p>
                                {selectedCase.admin_notes && (
                                    <p>📝 Last Note: {selectedCase.admin_notes}</p>
                                )}
                            </div>

                            {/* Admin actions */}
                            <div className="space-y-3 pt-2 border-t border-border">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Update Status</label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="resolved">Mark Resolved</SelectItem>
                                            <SelectItem value="escalated">Escalate</SelectItem>
                                            <SelectItem value="fraud">Flag as Fraud</SelectItem>
                                            <SelectItem value="false_positive">False Positive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Admin Note</label>
                                    <Textarea
                                        placeholder="Add investigation notes..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        className="resize-none text-sm"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => { handleRetry(selectedCase!); }}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedCase(null)}>Cancel</Button>
                        <Button onClick={handleUpdateCase} disabled={updateCase.isPending}>
                            {updateCase.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Reconciliation;
