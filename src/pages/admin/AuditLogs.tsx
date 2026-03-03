import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    ShieldCheck, Search, Filter, User, Clock, FileText,
    Activity, AlertTriangle, Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const mockLogs = [
    { id: 1, admin: "Super Admin", action: "Updated wallet balance +₦5,000", target: "John Doe", timestamp: new Date(), ip: "41.58.100.21", type: "financial" },
    { id: 2, admin: "Support Staff", action: "Deactivated user account", target: "Jane Smith", timestamp: new Date(Date.now() - 900000), ip: "41.58.100.22", type: "user" },
    { id: 3, admin: "Finance Team", action: "Refunded transaction TXN-T12345 ₦12,000", target: "Bob Wilson", timestamp: new Date(Date.now() - 7200000), ip: "41.58.100.25", type: "financial" },
    { id: 4, admin: "System", action: "Daily backup completed successfully", target: "Database", timestamp: new Date(Date.now() - 21600000), ip: "Internal", type: "system" },
    { id: 5, admin: "Service Manager", action: "Added new Data Plan MTN 20GB", target: "Data Service", timestamp: new Date(Date.now() - 86400000), ip: "41.58.100.21", type: "service" },
    { id: 6, admin: "Super Admin", action: "Blocked IP: 154.120.0.1", target: "Security System", timestamp: new Date(Date.now() - 3600000), ip: "41.58.100.10", type: "security" },
];

const typeBadge: Record<string, JSX.Element> = {
    financial: <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Financial</Badge>,
    user: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">User</Badge>,
    system: <Badge variant="outline" className="bg-accent text-muted-foreground border-border text-[10px]">System</Badge>,
    service: <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Service</Badge>,
    security: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">Security</Badge>,
};

const AuditLogs = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const filtered = mockLogs.filter((log) => {
        const matchSearch =
            log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.target.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = typeFilter === "all" || log.type === typeFilter;
        return matchSearch && matchType;
    });

    const exportCSV = () => {
        const rows = [
            ["Admin", "Action", "Target", "IP", "Type", "Timestamp"],
            ...filtered.map((l) => [l.admin, l.action, l.target, l.ip, l.type, format(l.timestamp, "yyyy-MM-dd HH:mm:ss")]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "audit_logs.csv"; a.click();
        toast.success("Exported audit_logs.csv");
    };

    return (
        <div className="max-w-screen-2xl space-y-6">
            <PageHeader
                title="Audit Logs"
                description="Complete history of all admin actions and system events"
                icon={ShieldCheck}
                badge={`${filtered.length} entries`}
                actions={
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export Logs
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search admin, action, or target..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    {["all", "financial", "user", "security", "service", "system"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${typeFilter === t ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Admin</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Action</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Target</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Type</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Timestamp</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">IP</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Log</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12 italic">No logs match your search.</TableCell>
                            </TableRow>
                        ) : filtered.map((log) => (
                            <TableRow key={log.id} className="border-border hover:bg-accent/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            {log.admin === "System" ? <Activity className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="text-xs font-medium">{log.admin}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                                    <p className="line-clamp-2">{log.action}</p>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{log.target}</TableCell>
                                <TableCell>{typeBadge[log.type] ?? <Badge variant="outline" className="text-[10px]">{log.type}</Badge>}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {format(log.timestamp, "MMM d, h:mm a")}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-[10px] font-mono text-muted-foreground">{log.ip}</code>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => toast.info(`Log ${log.id} details`)}>
                                        <FileText className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AuditLogs;
