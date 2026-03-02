import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
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
    MoreVertical,
    UserCheck,
    UserX,
    Mail,
    Smartphone,
    Calendar,
    Wallet,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

const UserManagement = () => {
    const { data: users, isLoading, error } = useUsers();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users?.filter((user) =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone_number?.includes(searchTerm)
    );

    const toggleUserStatus = (userId: string, currentStatus: string) => {
        // This would be a mutation in a real app
        toast.success(`User status ${currentStatus === "active" ? "deactivated" : "activated"} successfully`);
    };

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <p className="font-bold">Error loading users</p>
                <p className="text-sm mt-2">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-sm text-slate-400">Manage and monitor all platform users</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search users..."
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
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-800/50">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-300 font-bold">User</TableHead>
                                <TableHead className="text-slate-300 font-bold">Contact</TableHead>
                                <TableHead className="text-slate-300 font-bold">Wallet Balance</TableHead>
                                <TableHead className="text-slate-300 font-bold">Signup Date</TableHead>
                                <TableHead className="text-slate-300 font-bold">Status</TableHead>
                                <TableHead className="text-right text-slate-300 font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-800 animate-pulse">
                                        <TableCell><div className="h-10 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-10 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-10 bg-slate-800 rounded w-3/4" /></TableCell>
                                        <TableCell><div className="h-10 bg-slate-800 rounded w-full" /></TableCell>
                                        <TableCell><div className="h-10 bg-slate-800 rounded w-1/2" /></TableCell>
                                        <TableCell><div className="h-10 bg-slate-800 rounded w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers && filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                    {user.full_name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{user.full_name}</p>
                                                    <p className="text-xs text-slate-400">@{user.username}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <Mail className="w-3 h-3 text-slate-500" />
                                                    {user.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <Smartphone className="w-3 h-3 text-slate-500" />
                                                    {user.phone_number || "No phone"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-bold text-white">
                                                <Wallet className="w-4 h-4 text-primary" />
                                                ₦{user.wallet_balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                                <Calendar className="w-3 h-3 text-slate-500" />
                                                {format(new Date(user.created_at), "MMM d, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={user.status === "active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-slate-700 text-slate-400">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-slate-700" />
                                                    <DropdownMenuItem onClick={() => toast.info(`Viewing ${user.username}'s profile`)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toast.info(`Viewing ${user.username}'s transactions`)}>
                                                        Transactions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-700" />
                                                    {user.status === "active" ? (
                                                        <DropdownMenuItem className="text-red-500" onClick={() => toggleUserStatus(user.id, "active")}>
                                                            <UserX className="w-4 h-4 mr-2" />
                                                            Deactivate account
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem className="text-green-500" onClick={() => toggleUserStatus(user.id, "inactive")}>
                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                            Activate account
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic border-slate-800">
                                        No users found matching your search.
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

export default UserManagement;
