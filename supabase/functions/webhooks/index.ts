// @ts-nocheck
// deno-lint-ignore-file
/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNDING_FEE = 50; // ₦50 flat fee per deposit

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature, paymentpoint-signature, x-xixapay-signature",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");

  if (!provider) return json({ error: "Provider required" }, 400);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  try {
    const payload = await req.json();
    let reference = "";
    let eventType = "";

    if (provider === "paystack") {
      eventType = payload.event;
      reference = payload.data?.reference;
    } else if (provider === "kvdata") {
      eventType = "transaction_update";
      reference = payload.reference || payload.request_id;
    } else if (provider === "vtpass") {
      eventType = payload.type || "transaction_update";
      reference = payload.request_id || payload.requestId || payload.transaction_id || "";

      const vtpassSecret = Deno.env.get("VTPASS_SECRET_KEY");
      const headerSecret = req.headers.get("x-vtpass-secret") || req.headers.get("secret-key");
      if (vtpassSecret && headerSecret && headerSecret !== vtpassSecret) {
        console.warn("[webhook] VTPass signature mismatch");
        return json({ error: "Invalid signature" }, 401);
      }
    } else if (provider === "paymentpoint") {
      eventType = payload.notification_status || "payment_update";
      reference = payload.transaction_id || "";

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
        }
      }

      if (payload.notification_status === "payment_successful" && payload.transaction_status === "success") {
        const grossAmount = Number(payload.amount_paid) || 0;
        const accountNumber = payload.virtual_account_number || payload.account_number || "";
        const txnRef = payload.transaction_id || payload.reference || `PP-${Date.now()}`;

        if (grossAmount > FUNDING_FEE) {
          const netAmount = grossAmount - FUNDING_FEE;
          let userId: string | null = null;

          // Look up user via virtual_accounts table
          if (accountNumber) {
            const { data: va } = await supabase
              .from("virtual_accounts")
              .select("user_id")
              .eq("account_number", accountNumber)
              .eq("provider", "paymentpoint")
              .single();
            if (va) userId = va.user_id;
          }

          // Fallback: try customer email -> profiles
          if (!userId && payload.customer?.email) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", payload.customer.email)
              .single();
            if (profile) userId = profile.id;
          }

          if (userId) {
            reference = txnRef;

            // Idempotency: check if reference already processed
            const { data: existing } = await supabase
              .from("transactions")
              .select("id")
              .eq("reference", txnRef)
              .eq("status", "success")
              .maybeSingle();

            if (!existing) {
              await supabase
                .from("transactions")
                .insert({
                  user_id: userId,
                  type: "wallet_fund",
                  amount: netAmount,
                  status: "success",
                  reference: txnRef,
                  description: `Wallet funded ₦${netAmount} (paid ₦${grossAmount}, fee ₦${FUNDING_FEE})`,
                  metadata: {
                    gateway: "paymentpoint",
                    gross_amount: grossAmount,
                    fee: FUNDING_FEE,
                    net_amount: netAmount,
                    webhook_payload: payload,
                  },
                });

              const { data: wallet } = await supabase
                .from("wallets")
                .select("balance")
                .eq("id", userId)
                .single();

              if (wallet) {
                await supabase
                  .from("wallets")
                  .update({ balance: wallet.balance + netAmount, updated_at: new Date().toISOString() })
                  .eq("id", userId);
              }

              console.log(`[webhook] PaymentPoint: paid ₦${grossAmount}, fee ₦${FUNDING_FEE}, credited ₦${netAmount} to user ${userId}`);
            } else {
              console.log(`[webhook] PaymentPoint: duplicate ref ${txnRef}, skipping`);
            }
          } else {
            console.warn(`[webhook] PaymentPoint: could not identify user for account ${accountNumber}`);
          }
        } else if (grossAmount > 0 && grossAmount <= FUNDING_FEE) {
          console.warn(`[webhook] PaymentPoint: deposit ₦${grossAmount} rejected — below minimum (>₦${FUNDING_FEE})`);
        }
      }
    } else if (provider === "xixapay") {
      eventType = payload.notification_status || "payment_update";
      reference = payload.transaction_id || "";

      if (payload.notification_status === "payment_successful" && payload.transaction_status === "success") {
        const grossAmount = Number(payload.amount_paid) || 0;
        const customerEmail = payload.customer?.email;

        if (grossAmount > FUNDING_FEE && customerEmail) {
          const netAmount = grossAmount - FUNDING_FEE;

          const { data: pendingTxns } = await supabase
            .from("transactions")
            .select("id, user_id, reference, amount")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10);

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
                amount: netAmount,
                description: `Wallet funded ₦${netAmount} (paid ₦${grossAmount}, fee ₦${FUNDING_FEE})`,
                metadata: {
                  gateway: "xixapay",
                  gross_amount: grossAmount,
                  fee: FUNDING_FEE,
                  net_amount: netAmount,
                  webhook_payload: payload,
                },
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
                .update({ balance: wallet.balance + netAmount, updated_at: new Date().toISOString() })
                .eq("id", matchedTxn.user_id);
            }

            console.log(`[webhook] XixaPay: paid ₦${grossAmount}, fee ₦${FUNDING_FEE}, credited ₦${netAmount} to user ${matchedTxn.user_id}`);
          }
        } else if (grossAmount > 0 && grossAmount <= FUNDING_FEE) {
          console.warn(`[webhook] XixaPay: deposit ₦${grossAmount} rejected — below minimum (>₦${FUNDING_FEE})`);
        }
      }
    }

    // Insert webhook event into DB (trigger handles Paystack/KVData/VTPass)
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
