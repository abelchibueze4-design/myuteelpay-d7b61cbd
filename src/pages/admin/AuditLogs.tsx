import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Shield, User, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

const mockLogs = [
    { id: 1, admin: "Super Admin", action: "Updated wallet balance", target: "John Doe", timestamp: new Date(), ip: "192.168.1.1" },
    { id: 2, admin: "Support Staff", action: "Deactivated user", target: "Jane Smith", timestamp: subMinutes(new Date(), 15), ip: "192.168.1.5" },
    { id: 3, admin: "Finance Team", action: "Refunded transaction #T12345", target: "Bob Wilson", timestamp: subHours(new Date(), 2), ip: "192.168.1.10" },
    { id: 4, admin: "System", action: "Daily backup completed", target: "Database", timestamp: subHours(new Date(), 6), ip: "Internal" },
    { id: 5, admin: "Service Manager", action: "Added new Data Plan", target: "MTN 20GB", timestamp: subDays(new Date(), 1), ip: "192.168.1.1" },
];

function subMinutes(date: Date, minutes: number) { return new Date(date.getTime() - minutes * 60000); }
function subHours(date: Date, hours: number) { return new Date(date.getTime() - hours * 3600000); }
function subDays(date: Date, days: number) { return new Date(date.getTime() - days * 86400000); }

const AuditLogs = () => {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                    <p className="text-sm text-slate-400">Track all administrative actions and system events</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-900 border-slate-800 w-full md:w-64"
                        />
                    </div>
                    <Button variant="outline" className="border-slate-800 bg-slate-900">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <Table>
                    <TableHeader className="bg-slate-800/50">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-300 font-bold">Admin/User</TableHead>
                            <TableHead className="text-slate-300 font-bold">Action</TableHead>
                            <TableHead className="text-slate-300 font-bold">Target</TableHead>
                            <TableHead className="text-slate-300 font-bold">Timestamp</TableHead>
                            <TableHead className="text-slate-300 font-bold">IP Address</TableHead>
                            <TableHead className="text-right text-slate-300 font-bold">Ref</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockLogs.map((log) => (
                            <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-sm font-medium text-white">{log.admin}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Shield className="w-3.5 h-3.5 text-primary" />
                                        {log.action}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-slate-400">{log.target}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {format(log.timestamp, "MMM d, h:mm aa")}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-mono text-slate-500">{log.ip}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
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
