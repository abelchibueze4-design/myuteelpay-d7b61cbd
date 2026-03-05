// @ts-nocheck
// deno-lint-ignore-file
/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider"); // 'paystack', 'kvdata', etc.

  if (!provider) return json({ error: "Provider required" }, 400);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  try {
    const payload = await req.json();
    let reference = "";
    let eventType = "";

    // 1. PROVIDER-SPECIFIC LOGIC (Signature Validation, Extraction)
    if (provider === "paystack") {
      eventType = payload.event;
      reference = payload.data?.reference;
      
      // Optional: Verify Paystack Signature
      // const signature = req.headers.get("x-paystack-signature");
      // ... verify ...
    } else if (provider === "kvdata") {
      eventType = "transaction_update";
      reference = payload.reference || payload.request_id;
    }

    // 2. INSERT INTO DB (Trigger will handle the business logic)
    const { data, error } = await supabase
      .from("webhook_events")
      .insert({
        provider,
        event_type: eventType,
        reference,
        payload,
      })
      .select()
      .single();

    if (error) {
      console.error("[webhook] DB Insert Error:", error);
      return json({ error: "Failed to log webhook event" }, 500);
    }

    console.log(`[webhook] Received ${eventType} from ${provider} - ID: ${data.id}`);

    return json({ message: "Webhook received", id: data.id });
  } catch (err) {
    console.error("[webhook] Global Error:", err);
    return json({ error: "Invalid payload" }, 400);
  }
});
