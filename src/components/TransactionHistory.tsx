import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Search, Filter, ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTopBar } from "@/components/DashboardTopBar";

const TYPE_LABELS: Record<string, string> = {
  wallet_fund: "Wallet Fund",
  airtime: "Airtime",
  data: "Data",
  cable_tv: "Cable TV",
  electricity: "Electricity",
  bulk_sms: "Bulk SMS",
  edu_pin: "Edu Pin",
  referral_bonus: "Referral Bonus",
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TransactionHistory = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id, "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => {
      const matchesSearch =
        !search ||
        (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        t.reference?.toLowerCase().includes(search.toLowerCase()) ||
        TYPE_LABELS[t.type]?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const hasActiveFilters = search || typeFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const formatAmount = (amount: number, type: string) => {
    const isCredit = type === "wallet_fund" || type === "referral_bonus";
    const prefix = isCredit ? "+" : "-";
    return `${prefix}₦${Math.abs(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-secondary min-h-full flex flex-col">
      <DashboardTopBar />

      <div className="gradient-hero px-4 pt-6 pb-12">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold text-primary-foreground">Transaction History</h1>
          <p className="text-primary-foreground/70 text-sm">
            {transactions?.length ?? 0} total transactions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        {/* Filters */}
        <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                <X className="w-3 h-3 mr-1" /> Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* Transaction List */}
        <div className="bg-card rounded-2xl shadow-card divide-y mb-8">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((t) => {
              const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus";
              return (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    {isCredit ? (
                      <ArrowDownCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {t.description || TYPE_LABELS[t.type] || t.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.created_at), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${isCredit ? "text-green-600" : "text-foreground"}`}>
                      {formatAmount(t.amount, t.type)}
                    </p>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[t.status] || ""}`}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">
              {hasActiveFilters ? "No transactions match your filters" : "No transactions yet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
