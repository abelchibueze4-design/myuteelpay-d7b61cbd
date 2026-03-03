import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Shield, Search, AlertTriangle, Lock, Eye, XCircle,
    UserX, Activity, Clock, Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const mockLogs = [
    { id: "1", admin: "support@uteelpay.com", action: "Credited wallet ₦5,000", target: "John Doe", timestamp: new Date(), ip: "41.58.100.21", severity: "info" },
    { id: "2", admin: "admin@uteelpay.com", action: "Deactivated user account", target: "@spamuser", timestamp: new Date(Date.now() - 900000), ip: "41.58.100.22", severity: "warning" },
    { id: "3", admin: "System", action: "Failed login attempt (×5)", target: "unknown@email.com", timestamp: new Date(Date.now() - 3600000), ip: "197.230.15.4", severity: "critical" },
    { id: "4", admin: "finance@uteelpay.com", action: "Processed refund ₦12,000", target: "TXN-AB1234", timestamp: new Date(Date.now() - 7200000), ip: "41.58.100.25", severity: "info" },
    { id: "5", admin: "System", action: "Suspicious bulk transactions", target: "@newuser99", timestamp: new Date(Date.now() - 86400000), ip: "154.120.0.1", severity: "critical" },
];

const blockedIPs = [
    { ip: "154.120.0.1", reason: "Brute force attempt", blocked: new Date(Date.now() - 3600000) },
    { ip: "197.230.15.4", reason: "Suspicious login pattern", blocked: new Date(Date.now() - 7200000) },
];

const SecurityMonitoring = () => {
    const [search, setSearch] = useState("");
    const [blockIPDialog, setBlockIPDialog] = useState(false);
    const [ipToBlock, setIpToBlock] = useState("");
    const [blockReason, setBlockReason] = useState("");
    const [blocked, setBlocked] = useState(blockedIPs);

    const filtered = mockLogs.filter(
        (l) =>
            l.admin.toLowerCase().includes(search.toLowerCase()) ||
            l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.target.toLowerCase().includes(search.toLowerCase()) ||
            l.ip.includes(search)
    );

    const handleBlockIP = () => {
        if (!ipToBlock) return toast.error("Enter an IP address");
        setBlocked([...blocked, { ip: ipToBlock, reason: blockReason || "Manual block", blocked: new Date() }]);
        setBlockIPDialog(false);
        setIpToBlock("");
        setBlockReason("");
        toast.success(`IP ${ipToBlock} blocked`);
    };

    const exportCSV = () => {
        const rows = [
            ["Admin", "Action", "Target", "IP", "Severity", "Timestamp"],
            ...filtered.map((l) => [l.admin, l.action, l.target, l.ip, l.severity, format(l.timestamp, "yyyy-MM-dd HH:mm:ss")]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "audit_logs.csv"; a.click();
        toast.success("Exported audit_logs.csv");
    };

    const severityBadge = (sev: string) => {
        if (sev === "critical") return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] gap-1"><AlertTriangle className="w-3 h-3" /> Critical</Badge>;
        if (sev === "warning") return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] gap-1"><AlertTriangle className="w-3 h-3" /> Warning</Badge>;
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] gap-1"><Activity className="w-3 h-3" /> Info</Badge>;
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Security & Monitoring"
                description="Admin audit logs, failed logins, IP blocking, and suspicious activity alerts"
                icon={Shield}
                badge="Live"
                badgeVariant="destructive"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Logs
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setBlockIPDialog(true)}>
                            <Lock className="w-3.5 h-3.5 mr-1.5" /> Block IP
                        </Button>
                    </div>
                }
            />

            {/* Critical Alert Banner */}
            {filtered.some((l) => l.severity === "critical") && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                    <p className="text-sm font-medium">
                        {filtered.filter((l) => l.severity === "critical").length} critical security events detected this session.
                    </p>
                </div>
            )}

            {/* Blocked IPs */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Lock className="w-4 h-4 text-destructive" /> Blocked IPs
                    </h3>
                    <Badge variant="destructive">{blocked.length} Blocked</Badge>
                </div>
                {blocked.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No IPs currently blocked.</p>
                ) : (
                    <div className="space-y-2">
                        {blocked.map((b) => (
                            <div key={b.ip} className="flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50">
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <div>
                                        <p className="font-mono text-sm font-semibold">{b.ip}</p>
                                        <p className="text-[10px] text-muted-foreground">{b.reason} · {format(b.blocked, "MMM d, h:mm a")}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 text-xs"
                                    onClick={() => { setBlocked(blocked.filter((x) => x.ip !== b.ip)); toast.success(`${b.ip} unblocked`); }}
                                >
                                    Unblock
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Audit Logs */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h3 className="font-bold text-base">Admin Activity Logs</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">All administrative actions with IP and timestamp</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input className="pl-9 h-8 text-xs" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-semibold text-xs uppercase">Admin</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Action</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Target</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">IP</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Severity</TableHead>
                            <TableHead className="font-semibold text-xs uppercase">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((log) => (
                            <TableRow key={log.id} className={`border-border transition-colors ${log.severity === "critical" ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-accent/20"}`}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                                            {log.admin === "System" ? <Activity className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                                        </div>
                                        <span className="text-xs font-medium truncate max-w-[100px]">{log.admin}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[180px]">{log.action}</TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">{log.target}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-mono text-[10px] text-muted-foreground">{log.ip}</p>
                                        {blocked.some((b) => b.ip === log.ip) && (
                                            <Lock className="w-3 h-3 text-red-500" aria-label="IP is blocked" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{severityBadge(log.severity)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {format(log.timestamp, "MMM d, h:mm a")}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Block IP Dialog */}
            <Dialog open={blockIPDialog} onOpenChange={setBlockIPDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-destructive" /> Block IP Address
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">IP Address</label>
                            <Input placeholder="e.g. 192.168.1.100" value={ipToBlock} onChange={(e) => setIpToBlock(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reason</label>
                            <Input placeholder="Reason for blocking..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockIPDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleBlockIP}>Block IP</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SecurityMonitoring;
