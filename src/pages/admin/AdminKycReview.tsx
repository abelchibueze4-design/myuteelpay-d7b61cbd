import { useState } from "react";
import { useAllKycSubmissions, useReviewKyc, KycSubmission } from "@/hooks/useKyc";
import { PageHeader } from "@/components/admin/PageHeader";
import { DateRangeExport } from "@/components/admin/DateRangeExport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Search, Eye,
} from "lucide-react";
import { format, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const statusBadge = (status: string) => {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "secondary", label: "Pending" },
    approved: { variant: "default", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
  };
  const cfg = map[status] || map.pending;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const AdminKycReview = () => {
  const { data: submissions = [], isLoading, refetch } = useAllKycSubmissions();
  const reviewKyc = useReviewKyc();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<KycSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const filtered = submissions.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.id_number.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = submissions.filter(s => s.status === "pending").length;

  const handleReview = (status: "approved" | "rejected") => {
    if (!selected) return;
    reviewKyc.mutate({ id: selected.id, status, admin_notes: adminNotes }, {
      onSuccess: () => { setSelected(null); setAdminNotes(""); },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC Verification"
        description={`${pendingCount} pending review${pendingCount !== 1 ? "s" : ""}`}
        icon={ShieldCheck}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {["all", "pending", "approved", "rejected"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
            {f} {f === "pending" && pendingCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{pendingCount}</Badge>}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID Type</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No submissions found</TableCell></TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="uppercase text-xs">{s.id_type}</TableCell>
                  <TableCell className="font-mono text-xs">{s.id_number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setSelected(s); setAdminNotes(s.admin_notes || ""); }}>
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review KYC Submission</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Full Name</span>{selected.full_name}</div>
                <div><span className="text-muted-foreground block text-xs">Date of Birth</span>{selected.date_of_birth}</div>
                <div><span className="text-muted-foreground block text-xs">ID Type</span><span className="uppercase">{selected.id_type}</span></div>
                <div><span className="text-muted-foreground block text-xs">ID Number</span><span className="font-mono">{selected.id_number}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground block text-xs">Address</span>{selected.address}</div>
                <div className="col-span-2"><span className="text-muted-foreground block text-xs">Status</span>{statusBadge(selected.status)}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold">Admin Notes</label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes (shown to user on rejection)" rows={3} />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="destructive" onClick={() => handleReview("rejected")} disabled={reviewKyc.isPending}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button onClick={() => handleReview("approved")} disabled={reviewKyc.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKycReview;
