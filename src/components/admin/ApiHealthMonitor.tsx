import { useApiHealth } from "@/hooks/useApiHealth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Activity, CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const PROVIDER_META: Record<string, { label: string; description: string }> = {
  kvdata: { label: "KVData API", description: "Airtime, Data, Cable TV, Electricity, Edu Pins" },
  paystack: { label: "Paystack", description: "Payment gateway & wallet funding" },
};

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Healthy" },
  degraded: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Degraded" },
  down: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Down" },
  unknown: { icon: Activity, color: "text-muted-foreground", bg: "bg-secondary border-border", label: "Unknown" },
};

const ApiHealthMonitor = () => {
  const { healthChecks, latestByProvider, isLoading, runCheck, isRunning } = useApiHealth();

  const providers = ["kvdata", "paystack"];

  const getResponseTimeColor = (ms: number | null) => {
    if (!ms) return "text-muted-foreground";
    if (ms < 1000) return "text-emerald-600";
    if (ms < 3000) return "text-amber-600";
    return "text-red-600";
  };

  // Build uptime from last 24 checks per provider
  const getUptimeHistory = (provider: string) => {
    if (!healthChecks) return [];
    return healthChecks
      .filter((c) => c.provider === provider)
      .slice(0, 24)
      .reverse();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-bold text-base">API Health Monitor</h3>
            <p className="text-xs text-muted-foreground">Real-time service provider status</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runCheck()}
          disabled={isRunning}
          className="gap-1.5"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRunning && "animate-spin")} />
          {isRunning ? "Checking..." : "Run Check"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => {
            const latest = latestByProvider[provider];
            const status = (latest?.status as keyof typeof STATUS_CONFIG) || "unknown";
            const config = STATUS_CONFIG[status];
            const StatusIcon = config.icon;
            const meta = PROVIDER_META[provider] || { label: provider, description: "" };
            const history = getUptimeHistory(provider);

            return (
              <div
                key={provider}
                className={cn("rounded-xl border p-4 transition-all", config.bg)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={cn("w-5 h-5", config.color)} />
                    <div>
                      <p className="text-sm font-bold">{meta.label}</p>
                      <p className="text-[10px] text-muted-foreground">{meta.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold uppercase tracking-wider border-none", config.bg, config.color)}
                    >
                      {config.label}
                    </Badge>
                    {latest && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {format(parseISO(latest.checked_at), "MMM d, HH:mm")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-semibold">Response</p>
                      <p className={cn("text-sm font-black", getResponseTimeColor(latest?.response_time_ms ?? null))}>
                        {latest?.response_time_ms ? `${latest.response_time_ms}ms` : "—"}
                      </p>
                    </div>
                    {latest?.error_message && (
                      <div className="max-w-[200px]">
                        <p className="text-[9px] text-muted-foreground uppercase font-semibold">Error</p>
                        <p className="text-[10px] text-red-600 truncate">{latest.error_message}</p>
                      </div>
                    )}
                  </div>

                  {/* Uptime bar */}
                  <div className="flex items-center gap-0.5">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        title={`${h.status} - ${format(parseISO(h.checked_at), "HH:mm")}`}
                        className={cn(
                          "w-1.5 h-5 rounded-full transition-all",
                          h.status === "healthy" ? "bg-emerald-400" :
                          h.status === "degraded" ? "bg-amber-400" :
                          "bg-red-400"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApiHealthMonitor;
