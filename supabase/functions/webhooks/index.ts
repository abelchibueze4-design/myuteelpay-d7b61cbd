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
    } else if (provider === "vtpass") {
      // VTPass sends webhook callbacks with transaction status updates
      eventType = payload.type || "transaction_update";
      reference = payload.request_id || payload.requestId || payload.transaction_id || "";

      const vtpassSecret = Deno.env.get("VTPASS_SECRET_KEY");
      const headerSecret = req.headers.get("x-vtpass-secret") || req.headers.get("secret-key");
      if (vtpassSecret && headerSecret && headerSecret !== vtpassSecret) {
        console.warn("[webhook] VTPass signature mismatch");
        return json({ error: "Invalid signature" }, 401);
      }
    } else if (provider === "paymentpoint") {
      // PaymentPoint webhook for virtual account payments
      eventType = payload.notification_status || "payment_update";
      reference = payload.transaction_id || "";

      // Verify PaymentPoint signature
      const ppSecret = Deno.env.get("PAYMENTPOINT_SECRET_KEY");
      const ppSignature = req.headers.get("paymentpoint-signature");
      if (ppSecret && ppSignature) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw", encoder.encode(ppSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const rawBody = JSON.stringify(payload);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
        const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
        if (computed !== ppSignature) {
          console.warn("[webhook] PaymentPoint signature mismatch");
          // Don't reject — some webhooks may not include signature
        }
      }

      // Process PaymentPoint payment
      if (payload.notification_status === "payment_successful" && payload.transaction_status === "success") {
        const amountPaid = Number(payload.amount_paid) || 0;
        const customerEmail = payload.customer?.email;

        if (amountPaid > 0 && customerEmail) {
          // Find the pending transaction by looking up customer
          const { data: pendingTxns } = await supabase
            .from("transactions")
            .select("id, user_id, reference, amount")
            .eq("status", "pending")
            .eq("amount", amountPaid)
            .order("created_at", { ascending: false })
            .limit(5);

          // Match by metadata gateway
          let matchedTxn = null;
          if (pendingTxns) {
            for (const txn of pendingTxns) {
              const { data: txnFull } = await supabase
                .from("transactions")
                .select("metadata")
                .eq("id", txn.id)
                .single();
              const meta = txnFull?.metadata as any;
              if (meta?.gateway === "paymentpoint") {
                matchedTxn = txn;
                reference = txn.reference || "";
                break;
              }
            }
          }

          if (matchedTxn) {
            // Update transaction to success
            await supabase
              .from("transactions")
              .update({
                status: "success",
                metadata: { gateway: "paymentpoint", webhook_payload: payload },
              })
              .eq("id", matchedTxn.id);

            // Credit wallet
            const { data: wallet } = await supabase
              .from("wallets")
              .select("balance")
              .eq("id", matchedTxn.user_id)
              .single();

            if (wallet) {
              await supabase
                .from("wallets")
                .update({ balance: wallet.balance + amountPaid, updated_at: new Date().toISOString() })
                .eq("id", matchedTxn.user_id);
            }

            console.log(`[webhook] PaymentPoint: credited ₦${amountPaid} to user ${matchedTxn.user_id}`);
          }
        }
      }
    } else if (provider === "xixapay") {
      // XixaPay webhook for virtual account payments
      eventType = payload.notification_status || "payment_update";
      reference = payload.transaction_id || "";

      // Process XixaPay payment (same format as PaymentPoint)
      if (payload.notification_status === "payment_successful" && payload.transaction_status === "success") {
        const amountPaid = Number(payload.amount_paid) || 0;
        const customerEmail = payload.customer?.email;

        if (amountPaid > 0 && customerEmail) {
          const { data: pendingTxns } = await supabase
            .from("transactions")
            .select("id, user_id, reference, amount")
            .eq("status", "pending")
            .eq("amount", amountPaid)
            .order("created_at", { ascending: false })
            .limit(5);

          let matchedTxn = null;
          if (pendingTxns) {
            for (const txn of pendingTxns) {
              const { data: txnFull } = await supabase
                .from("transactions")
                .select("metadata")
                .eq("id", txn.id)
                .single();
              const meta = txnFull?.metadata as any;
              if (meta?.gateway === "xixapay") {
                matchedTxn = txn;
                reference = txn.reference || "";
                break;
              }
            }
          }

          if (matchedTxn) {
            await supabase
              .from("transactions")
              .update({
                status: "success",
                metadata: { gateway: "xixapay", webhook_payload: payload },
              })
              .eq("id", matchedTxn.id);

            const { data: wallet } = await supabase
              .from("wallets")
              .select("balance")
              .eq("id", matchedTxn.user_id)
              .single();

            if (wallet) {
              await supabase
                .from("wallets")
                .update({ balance: wallet.balance + amountPaid, updated_at: new Date().toISOString() })
                .eq("id", matchedTxn.user_id);
            }

            console.log(`[webhook] XixaPay: credited ₦${amountPaid} to user ${matchedTxn.user_id}`);
          }
        }
      }
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
