import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Users, Search, Filter, MoreVertical, UserCheck, UserX,
    Wallet, Shield, Eye, Download, Mail,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const UserManagement = () => {
    const { data: users, isLoading, error, refetch } = useUsers();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [walletDialog, setWalletDialog] = useState<{ open: boolean; user: any }>({ open: false, user: null });
    const [walletAmount, setWalletAmount] = useState("");
    const [walletAction, setWalletAction] = useState<"credit" | "debit">("credit");
    const [walletNote, setWalletNote] = useState("");
    const [processingWallet, setProcessingWallet] = useState(false);

    const filtered = (users ?? []).filter((u) => {
        const matchSearch =
            u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.phone_number?.includes(search);
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleToggleStatus = async (userId: string, current: string) => {
        const { error } = await supabase
            .from("profiles")
            .update({ deactivated_at: current === "active" ? new Date().toISOString() : null } as any)
            .eq("id", userId);
        if (error) toast.error("Failed to update user status");
        else {
            toast.success(`User ${current === "active" ? "deactivated" : "activated"}`);
            refetch();
        }
    };

    const handleWalletAdjust = async () => {
        const amt = parseFloat(walletAmount);
        if (!amt || amt <= 0) return toast.error("Enter a valid amount");
        setProcessingWallet(true);
        // Log to admin_wallet_adjustments table (must exist in DB)
        const { error } = await supabase.from("transactions" as any).insert({
            user_id: walletDialog.user?.id,
            type: walletAction === "credit" ? "admin_credit" : "admin_debit",
            amount: walletAction === "credit" ? amt : -amt,
            status: "success",
            description: walletNote || `Admin ${walletAction}`,
            reference: `ADM-${Date.now()}`,
        });
        setProcessingWallet(false);
        if (error) toast.error("Adjustment failed: " + error.message);
        else {
            toast.success(`Wallet ${walletAction} of ₦${amt.toLocaleString()} successful`);
            setWalletDialog({ open: false, user: null });
            setWalletAmount("");
            setWalletNote("");
            refetch();
        }
    };

    const exportCSV = () => {
        const rows = [
            ["Name", "Username", "Phone", "Wallet Balance", "Status", "Joined"],
            ...(filtered.map((u) => [u.full_name, u.username, u.phone_number, u.wallet_balance, u.status, format(new Date(u.created_at), "yyyy-MM-dd")])),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
        toast.success("Exported users.csv");
    };

    return (
        <div className="max-w-screen-2xl space-y-6">
            <PageHeader
                title="User Management"
                description="View, search, and manage all registered platform users"
                icon={Users}
                badge={`${(users ?? []).length} total`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search name, username, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">User</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Contact</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Wallet</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">KYC</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Joined</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-border">
                                    {Array.from({ length: 7 }).map((__, j) => (
                                        <TableCell key={j}><div className="h-8 bg-accent rounded" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-destructive py-8">
                                    Failed to load users. {(error as Error).message}
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12 italic">
                                    No users found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((user) => (
                            <TableRow key={user.id} className="border-border hover:bg-accent/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-purple-100 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                            {user.full_name?.[0]?.toUpperCase() ?? "?"}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{user.full_name}</p>
                                            <p className="text-[11px] text-muted-foreground">@{user.username}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Mail className="w-3 h-3" /> {user.email}
                                        </div>
                                        <p className="text-xs text-muted-foreground pl-4">{user.phone_number || "No phone"}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5 text-primary" />
                                        <span className="font-bold text-sm">₦{(user.wallet_balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                                        Pending
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {format(new Date(user.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={user.status === "active"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"}
                                        variant="outline"
                                    >
                                        {user.status === "active" ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel className="text-xs">User Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => toast.info(`Viewing ${user.username}`)}>
                                                <Eye className="w-4 h-4 mr-2" /> View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setWalletDialog({ open: true, user }); setWalletAction("credit"); }}>
                                                <Wallet className="w-4 h-4 mr-2" /> Credit Wallet
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setWalletDialog({ open: true, user }); setWalletAction("debit"); }}>
                                                <Wallet className="w-4 h-4 mr-2" /> Debit Wallet
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast.info("Role assignment coming soon")}>
                                                <Shield className="w-4 h-4 mr-2" /> Assign Role
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {user.status === "active" ? (
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleToggleStatus(user.id, "active")}>
                                                    <UserX className="w-4 h-4 mr-2" /> Deactivate
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => handleToggleStatus(user.id, "inactive")}>
                                                    <UserCheck className="w-4 h-4 mr-2" /> Activate
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Wallet Adjustment Dialog */}
            <Dialog open={walletDialog.open} onOpenChange={(o) => setWalletDialog({ open: o, user: walletDialog.user })}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Wallet {walletAction === "credit" ? "Credit" : "Debit"}
                        </DialogTitle>
                    </DialogHeader>
                    {walletDialog.user && (
                        <div className="space-y-4 pt-2">
                            <div className="p-3 bg-accent/50 rounded-xl text-sm">
                                <p className="font-semibold">{walletDialog.user.full_name}</p>
                                <p className="text-muted-foreground text-xs">@{walletDialog.user.username}</p>
                                <p className="text-xs mt-1">Current Balance: <span className="font-bold text-primary">₦{(walletDialog.user.wallet_balance ?? 0).toLocaleString("en-NG")}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant={walletAction === "credit" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setWalletAction("credit")}>+ Credit</Button>
                                <Button variant={walletAction === "debit" ? "destructive" : "outline"} size="sm" className="flex-1" onClick={() => setWalletAction("debit")}>− Debit</Button>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount (₦)</label>
                                <Input type="number" placeholder="0.00" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Note (optional)</label>
                                <Input placeholder="Reason for adjustment..." value={walletNote} onChange={(e) => setWalletNote(e.target.value)} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWalletDialog({ open: false, user: null })}>Cancel</Button>
                        <Button
                            onClick={handleWalletAdjust}
                            disabled={processingWallet}
                            variant={walletAction === "debit" ? "destructive" : "default"}
                        >
                            {processingWallet ? "Processing..." : `Confirm ${walletAction}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagement;
