import { useState, useEffect } from "react";
import { Landmark, Copy, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function VirtualAccountModule({ enabledGateways, fundingFee }: { enabledGateways: string[]; fundingFee: number }) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchAccounts = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/virtual-account?action=get_static`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ gateways: enabledGateways, forceRefresh }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load accounts");
      setAccounts(data.bankAccounts || []);
      if (forceRefresh && data.bankAccounts?.length > 0) {
        toast.success("Accounts refreshed!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabledGateways.length > 0) fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledGateways.join(",")]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Loading / error / empty — slim inline
  if (loading && !accounts) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] text-muted-foreground">Loading accounts...</span>
      </div>
    );
  }

  if (error && !accounts) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-[10px] text-destructive">{error}</span>
        <Button onClick={() => fetchAccounts()} variant="ghost" size="sm" className="h-6 text-[9px] px-2">Retry</Button>
      </div>
    );
  }

  if (accounts && accounts.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">No virtual accounts yet</span>
        </div>
        <Button onClick={() => fetchAccounts(true)} size="sm" className="h-6 text-[9px] px-2 rounded-lg font-bold" disabled={loading}>
          Generate
        </Button>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) return null;

  const firstAccount = accounts[0];
  const hasMore = accounts.length > 1;

  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-extrabold text-foreground">Fund via Bank Transfer</span>
          <span className="text-[8px] text-amber-600 dark:text-amber-400 font-bold">(₦{fundingFee} fee)</span>
        </div>
        <div className="flex items-center gap-1">
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-5 px-1.5 text-[8px] text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <>{accounts.length} accts <ChevronDown className="w-3 h-3 ml-0.5" /></>}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchAccounts(true)}
            disabled={loading}
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* First account always visible — compact row */}
      <AccountRow acc={firstAccount} idx={0} copiedIdx={copiedIdx} onCopy={handleCopy} />

      {/* Expanded: remaining accounts */}
      {expanded && accounts.slice(1).map((acc, i) => (
        <AccountRow key={`${acc.accountNumber}-${i + 1}`} acc={acc} idx={i + 1} copiedIdx={copiedIdx} onCopy={handleCopy} />
      ))}
    </div>
  );
}

function AccountRow({ acc, idx, copiedIdx, onCopy }: { acc: any; idx: number; copiedIdx: number | null; onCopy: (text: string, idx: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 group hover:border-primary/30 transition-colors">
      <div className="w-0.5 h-6 rounded-full bg-primary/30 group-hover:bg-primary transition-colors shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate">{acc.bankName}</span>
          {acc.provider && <Badge variant="secondary" className="text-[7px] h-3.5 px-1 font-semibold rounded">{acc.provider}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-foreground tracking-tight font-mono">{acc.accountNumber}</span>
          <span className="text-[8px] text-foreground/60 truncate">· {acc.accountName}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onCopy(acc.accountNumber, idx)}
        className="h-7 w-7 shrink-0 hover:bg-primary/10 rounded-md"
      >
        {copiedIdx === idx ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-primary" />
        )}
      </Button>
    </div>
  );
}
