import { useState, useEffect } from "react";
import { Landmark, Copy, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function VirtualAccountModule({ enabledGateways, fundingFee }: { enabledGateways: string[]; fundingFee: number }) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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
        toast.success("Accounts refreshed successfully!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabledGateways.length > 0) {
      fetchAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledGateways.join(",")]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Account number copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-foreground leading-tight">Your Virtual Accounts</h3>
            <p className="text-[9px] text-muted-foreground">Transfer to fund your wallet instantly</p>
          </div>
        </div>
        {accounts && accounts.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchAccounts(true)}
            disabled={loading}
            className="text-[10px] h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>
      
      {/* Fee notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-snug">
          A fee of <span className="font-bold">₦{fundingFee}</span> will be deducted per transaction. Transfer any amount above ₦{fundingFee} to fund your wallet.
        </p>
      </div>
      
      {/* Loading state */}
      {loading && !accounts && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground ml-2">Loading your accounts...</span>
        </div>
      )}

      {/* Error state */}
      {error && !accounts && (
        <div className="text-center py-4 bg-destructive/5 rounded-xl border border-destructive/20">
          <p className="text-xs text-destructive">{error}</p>
          <Button onClick={() => fetchAccounts()} variant="outline" size="sm" className="mt-2 h-7 text-[10px]">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty state — generate */}
      {accounts && accounts.length === 0 && !loading && (
        <div className="text-center py-6 bg-secondary/30 rounded-2xl border border-border border-dashed">
          <Landmark className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-3">No virtual accounts assigned yet.</p>
          <Button 
            onClick={() => fetchAccounts(true)} 
            size="sm" 
            className="rounded-xl h-9 text-xs font-bold"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Accounts"
            )}
          </Button>
        </div>
      )}

      {/* Account cards */}
      {accounts && accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((acc: any, i: number) => (
            <div 
              key={`${acc.accountNumber}-${i}`} 
              className="border border-border rounded-xl p-3 bg-background shadow-sm relative overflow-hidden group transition-all hover:border-primary/30"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-colors" />
              
              <div className="flex items-center justify-between mb-0.5 pl-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{acc.bankName}</span>
                {acc.provider && (
                  <Badge variant="secondary" className="text-[8px] h-4 px-1.5 font-semibold rounded-md">
                    {acc.provider}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between pl-2">
                <span className="text-xl font-black text-foreground tracking-tight font-mono">{acc.accountNumber}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(acc.accountNumber, i)}
                  className="h-8 w-8 hover:bg-primary/10 rounded-lg transition-all tap-target"
                >
                  {copiedIdx === i ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-primary" />
                  )}
                </Button>
              </div>
              
              <p className="text-[10px] font-medium text-foreground/70 pl-2">{acc.accountName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
