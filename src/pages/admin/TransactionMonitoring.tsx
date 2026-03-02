import { useState } from "react";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const TransactionMonitoring = () => {
    const { data: transactions, isLoading, error } = useAdminTransactions();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredTransactions = transactions?.filter((t) => {
        const matchesSearch =
            t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || t.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "success":
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>;
            case "failed":
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
            default:
                return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    const formatType = (type: string) => {
        return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <p className="font-bold">Error loading transactions</p>
                <p className="text-sm mt-2">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Transaction Monitoring</h1>
                    <p className="text-sm text-slate-400">Monitor and manage all system transactions real-time</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Ref ID, user, or desc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-900 border-slate-800 w-full md:w-64"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px] bg-slate-900 border-slate-800">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="border-slate-800 bg-slate-900" onClick={() => toast.info("Exporting logs...")}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-800/50">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-300 font-bold w-[180px]">Reference</TableHead>
                                <TableHead className="text-slate-300 font-bold">User</TableHead>
                                <TableHead className="text-slate-300 font-bold">Service Info</TableHead>
                                <TableHead className="text-slate-300 font-bold text-right">Amount</TableHead>
                                <TableHead className="text-slate-300 font-bold">Status</TableHead>
                                <TableHead className="text-slate-300 font-bold">Timestamp</TableHead>
                                <TableHead className="text-right text-slate-300 font-bold">Detail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-800 animate-pulse">
                                        <TableCell><div className="h-4 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-4 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-4 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-4 bg-slate-800 rounded w-full ml-auto" /></TableCell>
                                        <TableCell><div className="h-4 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-4 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-8 bg-slate-800 rounded w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredTransactions && filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t) => (
                                    <TableRow key={t.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <TableCell className="font-mono text-[10px] text-slate-400">
                                            {t.reference || t.id.split("-")[0]}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-medium text-white">{t.user_name}</p>
                                                <p className="text-[10px] text-slate-500">@{t.user_handle}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm text-slate-200">{formatType(t.type)}</p>
                                                <p className="text-[10px] text-slate-500 line-clamp-1">{t.description || "N/A"}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className={`text-sm font-bold ${t.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                                                {t.amount < 0 ? "-" : "+"}₦{Math.abs(t.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(t.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-slate-300">
                                                <p>{format(new Date(t.created_at), "MMM d, yyyy")}</p>
                                                <p className="text-slate-500">{format(new Date(t.created_at), "h:mm aa")}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="hover:bg-slate-700 text-slate-400" onClick={() => toast.info(`Viewing details for ${t.reference}`)}>
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-slate-500 italic border-slate-800">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default TransactionMonitoring;
