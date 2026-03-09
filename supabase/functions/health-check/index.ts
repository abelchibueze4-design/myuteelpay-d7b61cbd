import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface HealthResult {
  provider: string;
  status: "healthy" | "degraded" | "down";
  response_time_ms: number;
  error_message: string | null;
}

async function pingProvider(
  name: string,
  url: string,
  headers: Record<string, string> = {},
  timeout = 10000
): Promise<HealthResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const elapsed = Date.now() - start;

    if (res.ok) {
      return {
        provider: name,
        status: elapsed > 5000 ? "degraded" : "healthy",
        response_time_ms: elapsed,
        error_message: null,
      };
    } else {
      return {
        provider: name,
        status: "degraded",
        response_time_ms: elapsed,
        error_message: `HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err) {
    return {
      provider: name,
      status: "down",
      response_time_ms: Date.now() - start,
      error_message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KVDATA_API_KEY = Deno.env.get("KVDATA_API_KEY");
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Ping providers in parallel
    const checks = await Promise.all([
      pingProvider("kvdata", "https://kvdataapi.net/api/", {
        Authorization: `Token ${KVDATA_API_KEY}`,
      }),
      pingProvider("paystack", "https://api.paystack.co/", {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      }),
    ]);

    // Store results in DB
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const rows = checks.map((c) => ({
      provider: c.provider,
      status: c.status,
      response_time_ms: c.response_time_ms,
      error_message: c.error_message,
    }));

    await supabase.from("api_health_checks").insert(rows);

    // Auto-update service status banner based on health
    const allHealthy = checks.every((c) => c.status === "healthy");
    const anyDown = checks.some((c) => c.status === "down");

    const newStatus = anyDown ? "outage" : allHealthy ? "operational" : "degraded";
    const statusMessage = anyDown
      ? "Some services are currently experiencing issues. We're working on it."
      : allHealthy
      ? "All services are running smoothly"
      : "Some services may be slower than usual";

    // Update site_configurations
    const { data: existingConfig } = await supabase
      .from("site_configurations")
      .select("*")
      .eq("platform", "web")
      .eq("is_active", true)
      .maybeSingle();

    if (existingConfig) {
      const configData = existingConfig.config_data as Record<string, unknown>;
      await supabase
        .from("site_configurations")
        .update({
          config_data: {
            ...configData,
            service_status: newStatus,
            service_status_message: statusMessage,
            service_status_visible: true,
          },
        })
        .eq("id", existingConfig.id);
    }

    return new Response(
      JSON.stringify({ success: true, checks, banner_status: newStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Health check error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
