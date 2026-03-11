import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  Search, Filter, ArrowDownLeft, ArrowUpRight, X,
  Calendar, RotateCcw, FileText, Download, ChevronRight,
  Receipt, MessageCircle, Printer, CalendarIcon, RotateCw, Copy, Share2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.png";
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

const WHATSAPP_NUMBER = "2349022334478";

// Extract token/pin from transaction metadata
function extractTokenOrPin(t: any): { label: string; value: string; serial?: string } | null {
  const meta = t.metadata;
  if (!meta) return null;

  const response = meta.kvdata_response || meta.vtpass_response;
  if (!response) return null;

  // Electricity tokens
  if (t.type === "electricity") {
    const token =
      response.token || response.Token ||
      response.purchased_code || response.mainToken ||
      response.content?.transactions?.purchased_code || 
      meta.token || meta.Token || "";
    if (token) return { label: "Electricity Token", value: String(token) };
  }

  // Edu pins
  if (t.type === "edu_pin") {
    const pin =
      response.pin || response.Pin ||
      response.purchased_code ||
      response.content?.transactions?.purchased_code || "";
    const serial = response.serial || response.Serial || 
      response.content?.transactions?.unique_element || "";
    if (pin) return { label: "PIN", value: String(pin), serial: serial ? String(serial) : undefined };
  }

  // Data card pins
  if (t.type === "data_card") {
    const pin =
      response.pin || response.Pin ||
      response.purchased_code ||
      response.content?.transactions?.purchased_code || "";
    const serial = response.serial || response.Serial || "";
    if (pin) return { label: "Data Card PIN", value: String(pin), serial: serial ? String(serial) : undefined };
  }

  return null;
}

interface TransactionHistoryProps {
  defaultType?: string;
  filter?: "all" | "services" | "wallet";
}

const SERVICE_ROUTES: Record<string, string> = {
  airtime: "/services/airtime",
  data: "/services/data",
  cable_tv: "/services/cable",
  electricity: "/services/electricity",
  bulk_sms: "/services/sms",
  edu_pin: "/services/edu",
  data_card: "/services/data-card",
};

const TransactionHistory = ({ defaultType = "all", filter = "all" }: TransactionHistoryProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success("Reference copied to clipboard");
  };

  const handleShareReceipt = (t: any) => {
    const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus" || t.type === "refund";
    const text = [
      `UteelPay Receipt`,
      `Service: ${TYPE_LABELS[t.type] || t.type}`,
      `Amount: ${formatAmount(t.amount, t.type)}`,
      `Status: ${t.status.toUpperCase()}`,
      `Reference: ${t.reference || t.id}`,
      `Date: ${format(parseISO(t.created_at), "MMM d, yyyy · HH:mm")}`,
      `Description: ${t.description || "N/A"}`,
      `\nPowered by UteelPay — www.uteelpay.com`,
    ].join("\n");
    if (navigator.share) {
      navigator.share({ title: "UteelPay Receipt", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard");
    }
  };

  const handleDownloadReceipt = (t: any) => {
    const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus" || t.type === "refund";
    const qrData = JSON.stringify({ ref: t.reference || t.id, amount: t.amount, status: t.status, date: t.created_at });
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${t.reference || t.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
          .receipt { max-width: 420px; margin: 0 auto; background: white; border-radius: 16px; padding: 0; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
          .header { background: linear-gradient(135deg, #7c3aed, #9333ea); padding: 28px 24px; text-align: center; color: white; }
          .header .brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px; }
          .header .brand img { width: 36px; height: 36px; border-radius: 8px; }
          .header .brand h1 { font-size: 22px; font-weight: 800; }
          .header p { font-size: 11px; opacity: 0.7; }
          .status { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 10px; }
          .status.success { background: rgba(255,255,255,0.2); color: white; }
          .status.pending { background: rgba(255,255,255,0.2); color: #fef08a; }
          .status.failed { background: rgba(255,255,255,0.2); color: #fca5a5; }
          .amount-row { text-align: center; padding: 20px 24px; border-bottom: 2px dashed #e2e8f0; }
          .amount-row .label { color: #64748b; font-size: 11px; margin-bottom: 4px; }
          .amount { font-size: 32px; font-weight: 800; }
          .amount.credit { color: #059669; }
          .amount.debit { color: #7c3aed; }
          .details { padding: 20px 24px; }
          .details h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; margin-bottom: 12px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .row:last-child { border-bottom: none; }
          .row .label { color: #64748b; font-size: 12px; }
          .row .value { color: #1e293b; font-size: 12px; font-weight: 600; text-align: right; max-width: 55%; word-break: break-all; }
          .qr-section { text-align: center; padding: 16px 24px 8px; border-top: 2px dashed #e2e8f0; }
          .qr-section p { font-size: 9px; color: #94a3b8; margin-top: 6px; }
          .footer { text-align: center; padding: 16px 24px 24px; }
          .footer p { font-size: 10px; color: #94a3b8; }
          .footer .support { margin-top: 8px; font-size: 10px; color: #7c3aed; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="brand">
              <img src="${window.location.origin}/favicon.png" alt="UteelPay" />
              <h1>UteelPay</h1>
            </div>
            <p>Transaction Receipt</p>
            <span class="status ${t.status}">${t.status.toUpperCase()}</span>
          </div>
          <div class="amount-row">
            <p class="label">Amount</p>
            <p class="amount ${isCredit ? 'credit' : 'debit'}">${formatAmount(t.amount, t.type)}</p>
          </div>
          <div class="details">
            <h3>Transaction Details</h3>
            <div class="row"><span class="label">Service</span><span class="value">${TYPE_LABELS[t.type] || t.type}</span></div>
            <div class="row"><span class="label">Description</span><span class="value">${t.description || 'N/A'}</span></div>
            <div class="row"><span class="label">Reference</span><span class="value">${t.reference || t.id}</span></div>
            <div class="row"><span class="label">Transaction ID</span><span class="value" style="font-size:10px;">${t.id}</span></div>
            <div class="row"><span class="label">Date & Time</span><span class="value">${format(parseISO(t.created_at), "MMM d, yyyy · HH:mm:ss")}</span></div>
            <div class="row"><span class="label">Payment Method</span><span class="value">Wallet Balance</span></div>
          </div>
          <div class="qr-section">
            <svg id="qr-placeholder" width="80" height="80"></svg>
            <p>Scan to verify this transaction</p>
          </div>
          <div class="footer">
            <p>Thank you for using UteelPay</p>
            <p class="support">Support: wa.me/2349022334478</p>
            <p style="margin-top:6px;">www.uteelpay.com</p>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
        <script>
          var qr = qrcode(0, 'M');
          qr.addData(${JSON.stringify(qrData)});
          qr.make();
          document.getElementById('qr-placeholder').outerHTML = qr.createSvgTag({ cellSize: 3, margin: 0 });
        </script>
      </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 800);
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
    <div className="bg-background min-h-screen flex flex-col font-sans">
      <DashboardTopBar />

      {/* Header Section */}
      <div className="relative overflow-hidden bg-primary px-4 pt-6 pb-14 sm:pt-8 lg:px-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                {filter === "wallet" ? "Wallet Summary" : filter === "services" ? "Service History" : "Financial Records"}
              </h1>
              <p className="text-white/60 text-[11px] mt-0.5 font-medium">
                {filter === "wallet" ? "Credits, debits & bonuses" : filter === "services" ? "Utility & service payments" : `${transactions?.length ?? 0} entries`}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl gap-1.5 h-8 px-3 text-xs font-bold">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl min-w-[160px]">
                <DropdownMenuItem onClick={() => handleExport("csv")} className="font-bold py-2 text-xs cursor-pointer">Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="font-bold py-2 text-xs cursor-pointer">Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20 pb-8">
        {/* Filters */}
        <div className="bg-card rounded-2xl p-3 shadow-lg shadow-primary/5 border border-border/50 mb-4">
          <div className="flex flex-col lg:flex-row gap-2 items-end">
            <div className="relative flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-xl border-border/60 bg-secondary/30 text-xs font-medium" />
              </div>
            </div>
            <div className="w-full lg:w-40">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 bg-secondary/30 font-bold px-3 text-xs">
                  <div className="flex items-center gap-1.5"><Filter className="w-3 h-3 text-primary" /><SelectValue placeholder="All types" /></div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all" className="font-bold text-xs">All Services</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="font-medium text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full lg:w-32">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 bg-secondary/30 font-bold px-3 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all" className="font-bold text-xs">All Status</SelectItem>
                  <SelectItem value="success" className="font-medium text-xs text-emerald-600">Success</SelectItem>
                  <SelectItem value="pending" className="font-medium text-xs text-amber-500">Pending</SelectItem>
                  <SelectItem value="failed" className="font-medium text-xs text-red-500">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1.5 w-full lg:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-9 rounded-xl border-border/60 bg-secondary/30 font-bold px-3 gap-1.5 text-[10px]", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-3 h-3" />
                    {dateFrom ? format(dateFrom, "MMM d") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} disabled={(date) => (dateTo ? date > dateTo : date > new Date())} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-9 rounded-xl border-border/60 bg-secondary/30 font-bold px-3 gap-1.5 text-[10px]", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-3 h-3" />
                    {dateTo ? format(dateTo, "MMM d") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} disabled={(date) => (dateFrom ? date < dateFrom : false) || date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-all gap-1.5 text-xs">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" /> Transactions
            </h2>
            {hasActiveFilters && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-0.5 rounded-full">{filtered.length} Found</p>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm divide-y divide-border/30">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-8 h-8 rounded-xl" />
                    <div className="space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-20" /></div>
                  </div>
                  <div className="text-right space-y-1.5"><Skeleton className="h-3 w-16 ml-auto" /><Skeleton className="h-2.5 w-12 ml-auto" /></div>
                </div>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((t) => {
                const isCredit = t.type === "wallet_fund" || t.type === "referral_bonus" || t.type === "refund";
                return (
                  <div key={t.id} className="group p-2.5 sm:p-3 flex items-center justify-between hover:bg-accent/5 transition-all cursor-pointer" onClick={() => setSelectedTx(t)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isCredit ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
                      )}>
                        {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-foreground text-[11px] truncate">
                            {t.description || TYPE_LABELS[t.type] || t.type}
                          </p>
                          <Badge variant="outline" className={cn("text-[6px] font-black uppercase h-3.5 px-1 shrink-0 border-none", STATUS_COLORS[t.status])}>
                            {t.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[8px] font-semibold text-primary/70 bg-primary/5 px-1 py-px rounded">
                            {TYPE_LABELS[t.type] || t.type}
                          </span>
                          <span className="text-[8px] text-muted-foreground truncate max-w-[90px]">
                            {t.reference?.slice(0, 8)}
                          </span>
                          <span className="text-[8px] text-muted-foreground hidden sm:inline">
                            · {format(parseISO(t.created_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <p className={cn("text-xs font-black", isCredit ? "text-emerald-600" : "text-foreground")}>
                        {formatAmount(t.amount, t.type)}
                      </p>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2 border border-border/50">
                  <RotateCcw className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">No transactions found</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    {hasActiveFilters ? "No matches for your filters." : "No transactions yet."}
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
            const qrData = JSON.stringify({ ref: t.reference || t.id, amount: t.amount, status: t.status });
            return (
              <div ref={receiptRef}>
                {/* Receipt header with logo */}
                <div className="bg-primary px-6 pt-7 pb-5 text-center">
                  <div className="flex items-center justify-center gap-2.5 mb-2">
                    <img src={logo} alt="UteelPay" className="w-9 h-9 rounded-lg object-contain" />
                    <h2 className="text-xl font-black text-white">UteelPay</h2>
                  </div>
                  <p className="text-white/50 text-xs">Transaction Receipt</p>
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

                 {/* Token/PIN display */}
                {(() => {
                  const tokenInfo = extractTokenOrPin(t);
                  if (!tokenInfo) return null;
                  return (
                    <div className="mx-6 mt-4 mb-0 bg-secondary rounded-2xl p-4 border-2 border-primary/20">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{tokenInfo.label}</p>
                      <p className="text-lg font-mono font-black tracking-wider text-primary break-all">{tokenInfo.value}</p>
                      {tokenInfo.serial && (
                        <p className="text-xs text-muted-foreground mt-1">Serial: <span className="font-bold">{tokenInfo.serial}</span></p>
                      )}
                    </div>
                  );
                })()}

                {/* Details */}
                <div className="px-6 py-4 space-y-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Transaction Details</p>
                  {[
                    ["Service", TYPE_LABELS[t.type] || t.type],
                    ["Description", t.description || "N/A"],
                    ["Reference", t.reference || t.id],
                    ["Transaction ID", t.id],
                    ["Date & Time", format(parseISO(t.created_at), "MMM d, yyyy · HH:mm:ss")],
                    ["Payment Method", "Wallet Balance"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-border/30 last:border-0">
                      <span className="text-xs text-muted-foreground font-medium shrink-0">{label}</span>
                      <span className="text-xs font-bold text-foreground text-right break-all max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center py-4 border-t border-dashed border-border/50">
                  <QRCodeSVG
                    value={qrData}
                    size={80}
                    level="M"
                    className="rounded"
                  />
                  <p className="text-[9px] text-muted-foreground mt-2">Scan to verify this transaction</p>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 space-y-2">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDownloadReceipt(t)}
                      className="flex-1 rounded-2xl h-12 font-bold gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleShareReceipt(t)}
                      className="flex-1 rounded-2xl h-12 font-bold gap-2 border-2"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleCopyRef(t.reference || t.id)}
                      className="flex-1 rounded-2xl h-11 font-bold gap-2 border-2 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Ref
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReportTransaction(t)}
                      className="flex-1 rounded-2xl h-11 font-bold gap-2 border-2 border-green-500 text-green-600 hover:bg-green-50 text-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Report
                    </Button>
                  </div>
                  {SERVICE_ROUTES[t.type] && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedTx(null);
                        navigate(SERVICE_ROUTES[t.type]);
                      }}
                      className="w-full rounded-2xl h-11 font-bold gap-2 border-2 text-xs"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> Buy Again
                    </Button>
                  )}
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
