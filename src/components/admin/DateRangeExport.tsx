import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { exportToCSV, printPDF } from "@/utils/exportUtils";
import { toast } from "sonner";

interface DateRangeExportProps {
  /** Title used for PDF header */
  reportTitle: string;
  /** Table headers for export */
  headers: string[];
  /** Function that returns rows filtered by the current date range */
  getFilteredData: (from: Date | undefined, to: Date | undefined) => any[][];
  /** Optional: callback when dates change so parent can filter its display */
  onDateRangeChange?: (from: Date | undefined, to: Date | undefined) => void;
  /** Optional: filename for CSV (defaults to reportTitle slug) */
  filename?: string;
  /** Compact mode for tight layouts */
  compact?: boolean;
}

export const DateRangeExport = ({
  reportTitle,
  headers,
  getFilteredData,
  onDateRangeChange,
  filename,
  compact = false,
}: DateRangeExportProps) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleDateChange = (type: "from" | "to", date: Date | undefined) => {
    const newFrom = type === "from" ? date : dateFrom;
    const newTo = type === "to" ? date : dateTo;
    if (type === "from") setDateFrom(date);
    else setDateTo(date);
    onDateRangeChange?.(newFrom, newTo);
  };

  const clearDates = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onDateRangeChange?.(undefined, undefined);
  };

  const handleExport = (type: "csv" | "pdf") => {
    const data = getFilteredData(dateFrom, dateTo);
    if (!data.length) {
      toast.error("No data available to export");
      return;
    }
    const slug = filename || reportTitle.toLowerCase().replace(/\s+/g, "_");
    const dateLabel = dateFrom || dateTo
      ? ` (${dateFrom ? format(dateFrom, "MMM d") : "Start"} – ${dateTo ? format(dateTo, "MMM d, yyyy") : "Today"})`
      : "";

    if (type === "csv") {
      exportToCSV(headers, data, slug);
      toast.success(`${reportTitle} exported as CSV`);
    } else {
      printPDF(`${reportTitle}${dateLabel}`, headers, data);
      toast.success("Print dialog opened for PDF");
    }
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", compact && "gap-1.5")}>
      {/* From date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-9", !dateFrom && "text-muted-foreground")}>
            <CalendarIcon className="w-3.5 h-3.5" />
            {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={(d) => handleDateChange("from", d)}
            disabled={(date) => (dateTo ? date > dateTo : date > new Date())}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* To date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-9", !dateTo && "text-muted-foreground")}>
            <CalendarIcon className="w-3.5 h-3.5" />
            {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={(d) => handleDateChange("to", d)}
            disabled={(date) => (dateFrom ? date < dateFrom : false) || date > new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Clear dates */}
      {(dateFrom || dateTo) && (
        <Button variant="ghost" size="sm" onClick={clearDates} className="text-xs h-9 text-muted-foreground hover:text-foreground">
          Clear
        </Button>
      )}

      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5 h-9">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
            <FileText className="w-3.5 h-3.5" /> Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2">
            <Printer className="w-3.5 h-3.5" /> Export as PDF / Print
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
