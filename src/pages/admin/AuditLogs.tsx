import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DateRangeExport } from "@/components/admin/DateRangeExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    ShieldCheck, Search, User, Clock, FileText, Activity, Download,
} from "lucide-react";
import { format, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const typeBadge: Record<string, JSX.Element> = {
    financial: <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Financial</Badge>,
    user: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">User</Badge>,
    system: <Badge variant="outline" className="bg-accent text-muted-foreground border-border text-[10px]">System</Badge>,
    service: <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Service</Badge>,
    security: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">Security</Badge>,
};

interface AuditLog {
    id: string;
    admin_id: string | null;
    admin_email: string;
    action: string;
    target_type: string;
    target_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

const AuditLogs = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();

    const { data: logs, isLoading } = useQuery({
        queryKey: ["admin_audit_logs"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("audit_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            return (data ?? []) as AuditLog[];
        },
    });

    const filtered = (logs ?? []).filter((log) => {
        const matchSearch =
            log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.target_type?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = typeFilter === "all" || log.target_type === typeFilter;
        const logDate = new Date(log.created_at);
        const matchDateFrom = !dateFrom || !isBefore(logDate, startOfDay(dateFrom));
        const matchDateTo = !dateTo || !isAfter(logDate, endOfDay(dateTo));
        return matchSearch && matchType && matchDateFrom && matchDateTo;
    });

    const types = [...new Set((logs ?? []).map((l) => l.target_type).filter(Boolean))];

    return (
        <div className="max-w-screen-2xl space-y-6">
            <PageHeader
                title="Audit Logs"
                description="Complete history of all admin actions and system events"
                icon={ShieldCheck}
                badge={`${filtered.length} entries`}
                actions={
                    <DateRangeExport
                        reportTitle="Audit Logs Report"
                        headers={["Admin", "Action", "Target Type", "Target ID", "Timestamp"]}
                        getFilteredData={(from, to) => {
                            const rows = (logs ?? []).filter((l) => {
                                const d = new Date(l.created_at);
                                const mf = !from || !isBefore(d, startOfDay(from));
                                const mt = !to || !isAfter(d, endOfDay(to));
                                return mf && mt;
                            });
                            return rows.map((l) => [
                                l.admin_email,
                                l.action,
                                l.target_type,
                                l.target_id ?? "",
                                format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
                            ]);
                        }}
                        onDateRangeChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
                    />
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search admin, action, or target..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setTypeFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                    >
                        all
                    </button>
                    {types.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
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
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-border">
                                    {Array.from({ length: 4 }).map((__, j) => (
                                        <TableCell key={j}><div className="h-6 bg-accent rounded" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-12 italic">
                                    No audit logs recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((log) => (
                            <TableRow key={log.id} className="border-border hover:bg-accent/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-medium truncate max-w-[150px]">{log.admin_email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[250px]">
                                    <p className="line-clamp-2">{log.action}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-0.5">
                                        {typeBadge[log.target_type] ?? <Badge variant="outline" className="text-[10px]">{log.target_type}</Badge>}
                                        {log.target_id && <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{log.target_id}</p>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(log.created_at), "MMM d, h:mm a")}
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

export default AuditLogs;
