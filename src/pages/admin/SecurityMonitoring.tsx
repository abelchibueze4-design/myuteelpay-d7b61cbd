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
    Shield, Search, AlertTriangle, Activity, Clock, Download,
    Users, CheckCircle2, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import { useUsers } from "@/hooks/useUsers";

const SecurityMonitoring = () => {
    const [search, setSearch] = useState("");
    const { data: transactions } = useAdminTransactions();
    const { data: users } = useUsers();

    const allTx = transactions ?? [];
    const failedTx = allTx.filter((t) => t.status === "failed");
    const successfulTx = allTx.filter((t) => t.status === "success");
    const deactivatedUsers = (users ?? []).filter((u) => u.status === "inactive");

    // Show failed transactions as security events
    const securityEvents = failedTx.map((t) => ({
        id: t.id,
        user: t.user_name || "Unknown",
        handle: t.user_handle || "unknown",
        action: `Failed ${t.type?.replace(/_/g, " ")} — ₦${Math.abs(t.amount).toLocaleString()}`,
        description: t.description || "Transaction failed",
        timestamp: t.created_at,
        severity: Math.abs(t.amount) > 5000 ? "high" : "medium",
    }));

    const filtered = securityEvents.filter(
        (e) =>
            e.user.toLowerCase().includes(search.toLowerCase()) ||
            e.action.toLowerCase().includes(search.toLowerCase())
    );

    const exportCSV = () => {
        const rows = [
            ["User", "Action", "Severity", "Timestamp"],
            ...filtered.map((e) => [e.user, e.action, e.severity, format(new Date(e.timestamp), "yyyy-MM-dd HH:mm:ss")]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "security_events.csv"; a.click();
        toast.success("Exported security_events.csv");
    };

    const severityBadge = (sev: string) => {
        if (sev === "high") return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] gap-1"><AlertTriangle className="w-3 h-3" /> High</Badge>;
        if (sev === "medium") return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] gap-1"><AlertTriangle className="w-3 h-3" /> Medium</Badge>;
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] gap-1"><Activity className="w-3 h-3" /> Low</Badge>;
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Security & Monitoring"
                description="Failed transactions, deactivated accounts, and platform security overview"
                icon={Shield}
                actions={
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export Events
                    </Button>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Total Transactions" value={allTx.length.toLocaleString()} icon={Activity} iconColor="text-blue-500" iconBg="bg-blue-500/10" />
                <StatCard label="Successful" value={successfulTx.length.toLocaleString()} icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-500/10" />
                <StatCard label="Failed" value={failedTx.length.toLocaleString()} icon={XCircle} iconColor="text-red-500" iconBg="bg-red-500/10" />
                <StatCard label="Deactivated Users" value={deactivatedUsers.length.toLocaleString()} icon={Users} iconColor="text-amber-500" iconBg="bg-amber-500/10" />
            </div>

            {/* Failed Transaction Alert */}
            {failedTx.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                        {failedTx.length} failed transaction{failedTx.length !== 1 ? "s" : ""} detected. Review below.
                    </p>
                </div>
            )}

            {/* Security Events (failed transactions) */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h3 className="font-bold text-base">Security Events</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Failed transactions flagged for review</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input className="pl-9 h-8 text-xs" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-semibold text-xs uppercase">User</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Event</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Severity</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-12 italic">
                                    No security events to display.
                                </TableCell>
                            </TableRow>
                        ) : filtered.slice(0, 50).map((event) => (
                            <TableRow key={event.id} className="border-border hover:bg-accent/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground">
                                            {event.user[0]?.toUpperCase() ?? "?"}
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium">{event.user}</span>
                                            <p className="text-[10px] text-muted-foreground">@{event.handle}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[250px]">{event.action}</TableCell>
                                <TableCell>{severityBadge(event.severity)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(event.timestamp), "MMM d, h:mm a")}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default SecurityMonitoring;
