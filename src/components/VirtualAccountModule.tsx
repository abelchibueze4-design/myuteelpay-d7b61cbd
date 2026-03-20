import { useState, useEffect } from "react";
import { Landmark, Copy, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function VirtualAccountModule({ enabledGateways, fundingFee }: { enabledGateways: string[]; fundingFee: number }) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // In a real scenario, we might want to pass forceRefresh to the backend to recreate accounts
      // For now, we'll just hit get_static.
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Landmark className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-extrabold text-foreground">Fund via Bank Transfer</h3>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-snug">
          Transfer to any of your dedicated accounts below to fund your wallet instantly. 
          <span className="font-bold"> Note: A fee of ₦{fundingFee} will be deducted per transaction.</span>
        </p>
      </div>
      
      {loading && !accounts && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground ml-3">Loading accounts...</span>
        </div>
      )}

      {error && !accounts && (
        <div className="text-sm text-red-500 text-center py-4 bg-red-50 rounded-xl border border-red-100">
          <p>{error}</p>
          <Button onClick={() => fetchAccounts()} variant="outline" size="sm" className="mt-2 h-8">
            Try Again
          </Button>
        </div>
      )}

      {accounts && accounts.length === 0 && !loading && (
        <div className="text-center py-6 bg-secondary/30 rounded-2xl border border-border border-dashed">
          <p className="text-xs text-muted-foreground mb-3">No virtual accounts assigned yet.</p>
          <Button onClick={() => fetchAccounts(true)} size="sm" className="rounded-xl h-9 text-xs font-bold">
            Generate Accounts
          </Button>
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="space-y-3">
          {accounts.map((acc: any, i: number) => (
            <div key={i} className="border border-border rounded-2xl p-4 bg-background/80 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{acc.bankName}</span>
                {acc.provider && <Badge variant="secondary" className="text-[8px] h-4 px-1.5 font-semibold">{acc.provider}</Badge>}
              </div>
              
              <div className="flex items-center justify-between mt-1 mb-2">
                <span className="text-2xl font-black text-foreground tracking-tight">{acc.accountNumber}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(acc.accountNumber);
                    toast.success("Account number copied!");
                  }}
                  className="h-8 w-8 hover:bg-primary/10 rounded-lg transition-colors tap-target text-primary"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-[11px] font-medium text-foreground/80">{acc.accountName}</p>
            </div>
          ))}
          
          <div className="flex justify-end pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchAccounts(true)}
              disabled={loading}
              className="text-[10px] h-7 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
