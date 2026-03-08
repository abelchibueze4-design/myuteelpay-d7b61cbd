import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  Search, Filter, ArrowDownLeft, ArrowUpRight, X,
  Calendar, RotateCcw, FileText, Download, ChevronRight,
  Receipt, MessageCircle, Printer, CalendarIcon,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { exportToCSV, printPDF } from "@/utils/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  wallet_fund: "Wallet Fund",
  airtime: "Airtime",
  data: "Data",
  cable_tv: "Cable TV",
  electricity: "Electricity",
  bulk_sms: "Bulk SMS",
  edu_pin: "Edu Pin",
  referral_bonus: "Referral Bonus",
  data_card: "Data Card",
  refund: "Refund",
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30",
  pending: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30",
  failed: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30",
};

const WHATSAPP_NUMBER = "2349159024872";

interface TransactionHistoryProps {
  defaultType?: string;
  filter?: "all" | "services" | "wallet";
}

const TransactionHistory = ({ defaultType = "all", filter = "all" }: TransactionHistoryProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(defaultType);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

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
      if (filter === "services") {
        const isService = t.type !== "wallet_fund" && t.type !== "referral_bonus";
        if (!isService) return false;
      } else if (filter === "wallet") {
        const isWalletAction = t.type === "wallet_fund" || t.type === "referral_bonus";
        if (!isWalletAction) return false;
      }

      const matchesSearch =
        !search ||
        (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        t.reference?.toLowerCase().includes(search.toLowerCase()) ||
        TYPE_LABELS[t.type]?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;

      // Date range filtering
      const txDate = parseISO(t.created_at);
      const matchesDateFrom = !dateFrom || !isBefore(txDate, startOfDay(dateFrom));
      const matchesDateTo = !dateTo || !isAfter(txDate, endOfDay(dateTo));

      return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [transactions, search, typeFilter, statusFilter, filter, dateFrom, dateTo]);

  const hasActiveFilters = search || typeFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const formatAmount = (amount: number, type: string) => {
    const isCredit = type === "wallet_fund" || type === "referral_bonus" || type === "refund";
    const prefix = isCredit ? "+" : "-";
    return `${prefix}₦${Math.abs(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  };

  const handleExport = (type: "csv" | "pdf") => {
    if (!filtered.length) {
      toast.error("No data available to export");
      return;
    }
    const headers = ["Date", "Description", "Reference", "Service", "Amount", "Status"];
    const data = filtered.map((t) => [
      format(parseISO(t.created_at), "yyyy-MM-dd HH:mm"),
      t.description || "N/A",
      t.reference || "N/A",
      TYPE_LABELS[t.type] || t.type,
      formatAmount(t.amount, t.type),
      t.status,
    ]);
    const reportTitle = filter === "wallet" ? "Wallet Summary" : filter === "services" ? "Service History" : "Transaction History";
    if (type === "csv") {
      exportToCSV(headers, data, reportTitle.toLowerCase().replace(/ /g, "_"));
      toast.success(`${reportTitle} exported to CSV`);
    } else {
      printPDF(reportTitle, headers, data);
      toast.success("Print dialog opened for PDF report");
    }
  };

  const handleDownloadReceipt = (t: any) => {
    const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus" || t.type === "refund";
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${t.reference || t.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
          .receipt { max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { font-size: 22px; color: #7c3aed; font-weight: 800; }
          .header p { font-size: 11px; color: #94a3b8; margin-top: 4px; }
          .status { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; }
          .status.success { background: #ecfdf5; color: #059669; }
          .status.pending { background: #fffbeb; color: #d97706; }
          .status.failed { background: #fef2f2; color: #dc2626; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          .row .label { color: #64748b; font-size: 13px; }
          .row .value { color: #1e293b; font-size: 13px; font-weight: 600; text-align: right; max-width: 55%; word-break: break-all; }
          .amount-row { margin-top: 16px; padding: 16px; border-radius: 12px; text-align: center; }
          .amount-row.credit { background: #ecfdf5; }
          .amount-row.debit { background: #faf5ff; }
          .amount { font-size: 28px; font-weight: 800; }
          .amount.credit { color: #059669; }
          .amount.debit { color: #7c3aed; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px dashed #e2e8f0; }
          .footer p { font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>UteelPay</h1>
            <p>Transaction Receipt</p>
            <span class="status ${t.status}">${t.status}</span>
          </div>
          <div class="row"><span class="label">Service</span><span class="value">${TYPE_LABELS[t.type] || t.type}</span></div>
          <div class="row"><span class="label">Description</span><span class="value">${t.description || 'N/A'}</span></div>
          <div class="row"><span class="label">Reference</span><span class="value">${t.reference || t.id}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${format(parseISO(t.created_at), "MMM d, yyyy · HH:mm")}</span></div>
          <div class="amount-row ${isCredit ? 'credit' : 'debit'}">
            <p style="font-size:11px;color:#64748b;margin-bottom:4px;">Amount</p>
            <p class="amount ${isCredit ? 'credit' : 'debit'}">${formatAmount(t.amount, t.type)}</p>
          </div>
          <div class="footer">
            <p>Thank you for using UteelPay</p>
            <p style="margin-top:4px;">For support, contact us on WhatsApp</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const handleReportTransaction = (t: any) => {
    const message = encodeURIComponent(
      `Hello UteelPay Support,\n\nI'd like to report a transaction issue:\n\n` +
      `• Service: ${TYPE_LABELS[t.type] || t.type}\n` +
      `• Amount: ${formatAmount(t.amount, t.type)}\n` +
      `• Reference: ${t.reference || t.id}\n` +
      `• Status: ${t.status}\n` +
      `• Date: ${format(parseISO(t.created_at), "MMM d, yyyy HH:mm")}\n` +
      `• Description: ${t.description || 'N/A'}\n\n` +
      `Please help me look into this. Thank you.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] min-h-screen flex flex-col font-sans">
      <DashboardTopBar />

      {/* Header Section */}
      <div className="relative overflow-hidden bg-primary px-4 pt-10 pb-20 sm:pt-12 lg:px-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {filter === "wallet" ? "Wallet Summary" : filter === "services" ? "Service History" : "Financial Records"}
              </h1>
              <p className="text-white/60 text-sm mt-1 font-medium italic">
                {filter === "wallet" ? "All credits, debits, and bonuses" : filter === "services" ? "Track your utility and service payments" : `${transactions?.length ?? 0} total entries documented`}
              </p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl gap-2 h-10 px-4 font-bold">
                    <Download className="w-4 h-4" /> Export Data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl min-w-[180px]">
                  <DropdownMenuItem onClick={() => handleExport("csv")} className="font-bold py-3 cursor-pointer">Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")} className="font-bold py-3 cursor-pointer">Export as PDF/Print</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20 pb-12">
        {/* Filters */}
        <div className="bg-card rounded-3xl p-6 shadow-xl shadow-primary/5 border border-border/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="relative flex-1 w-full">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1 mb-1.5 block">Search Records</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Reference, service, or description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-12 rounded-2xl border-border/60 focus-visible:ring-primary/20 bg-secondary/30 font-medium" />
              </div>
            </div>
            <div className="w-full lg:w-48">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1 mb-1.5 block">Service Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-secondary/30 font-bold px-4">
                  <div className="flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-primary" /><SelectValue placeholder="All types" /></div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all" className="font-bold">All Services</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="font-medium">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full lg:w-40">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1 mb-1.5 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-secondary/30 font-bold px-4"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all" className="font-bold">Every Status</SelectItem>
                  <SelectItem value="success" className="font-medium text-emerald-600">Success Only</SelectItem>
                  <SelectItem value="pending" className="font-medium text-amber-500">Pending</SelectItem>
                  <SelectItem value="failed" className="font-medium text-red-500">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Date Range */}
            <div className="flex gap-2 w-full lg:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-12 rounded-2xl border-border/60 bg-secondary/30 font-bold px-4 gap-2 text-xs", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} disabled={(date) => (dateTo ? date > dateTo : date > new Date())} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-12 rounded-2xl border-border/60 bg-secondary/30 font-bold px-4 gap-2 text-xs", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} disabled={(date) => (dateFrom ? date < dateFrom : false) || date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-12 px-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-all gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Transaction Stream
            </h2>
            {hasActiveFilters && (
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-3 py-1 rounded-full">{filtered.length} Found</p>
            )}
          </div>

          <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm divide-y divide-border/30">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                  </div>
                  <div className="text-right space-y-2"><Skeleton className="h-4 w-20 ml-auto" /><Skeleton className="h-3 w-16 ml-auto" /></div>
                </div>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((t) => {
                const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus" || t.type === "refund";
                return (
                  <div key={t.id} className="group p-5 sm:p-6 flex items-center justify-between hover:bg-accent/5 transition-all cursor-pointer" onClick={() => setSelectedTx(t)}>
                    <div className="flex items-center gap-5 min-w-0">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 shadow-sm",
                        isCredit ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30" : "bg-primary/5 text-primary border-primary/10"
                      )}>
                        {isCredit ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm sm:text-base tracking-tight truncate group-hover:text-primary transition-colors">
                          {t.description || TYPE_LABELS[t.type] || t.type}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Ref: {t.reference?.slice(0, 10)}...</p>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                            <Calendar className="w-2.5 h-2.5" />
                            {format(parseISO(t.created_at), "MMM d, yyyy · HH:mm")}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className={cn("text-lg font-black tracking-tighter", isCredit ? "text-emerald-600" : "text-foreground")}>
                          {formatAmount(t.amount, t.type)}
                        </p>
                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.2em] h-5 decoration-none border-none", STATUS_COLORS[t.status])}>
                          {t.status}
                        </Badge>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-24 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 border border-border/50">
                  <RotateCcw className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Empty feed detected</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto italic mt-1">
                    {hasActiveFilters ? "We couldn't find any transactions matching your specific filters." : "You haven't made any transactions yet."}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="rounded-xl font-bold border-2">Clear all filters</Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="rounded-3xl max-w-md p-0 overflow-hidden border-none">
          {selectedTx && (() => {
            const t = selectedTx;
            const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus" || t.type === "refund";
            return (
              <div ref={receiptRef}>
                {/* Receipt header */}
                <div className="bg-primary px-6 pt-8 pb-6 text-center">
                  <h2 className="text-xl font-black text-white">UteelPay</h2>
                  <p className="text-white/50 text-xs mt-1">Transaction Receipt</p>
                  <Badge variant="outline" className={cn("mt-3 text-[10px] font-black uppercase tracking-[0.15em] border-none", STATUS_COLORS[t.status])}>
                    {t.status}
                  </Badge>
                </div>

                {/* Amount */}
                <div className={cn("text-center py-5 border-b border-dashed border-border/50", isCredit ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "bg-primary/5")}>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Amount</p>
                  <p className={cn("text-3xl font-black tracking-tighter", isCredit ? "text-emerald-600" : "text-primary")}>
                    {formatAmount(t.amount, t.type)}
                  </p>
                </div>

                {/* Details */}
                <div className="px-6 py-5 space-y-3">
                  {[
                    ["Service", TYPE_LABELS[t.type] || t.type],
                    ["Description", t.description || "N/A"],
                    ["Reference", t.reference || t.id],
                    ["Date", format(parseISO(t.created_at), "MMM d, yyyy · HH:mm")],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="text-xs text-muted-foreground font-medium shrink-0">{label}</span>
                      <span className="text-xs font-bold text-foreground text-right break-all">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                  <Button
                    onClick={() => handleDownloadReceipt(t)}
                    className="flex-1 rounded-2xl h-12 font-bold gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Printer className="w-4 h-4" /> Download Receipt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReportTransaction(t)}
                    className="flex-1 rounded-2xl h-12 font-bold gap-2 border-2 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="w-4 h-4" /> Report Issue
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistory;
