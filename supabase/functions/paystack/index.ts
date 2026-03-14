// @ts-nocheck
// deno-lint-ignore-file
/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  if (!PAYSTACK_SECRET) {
    console.error("PAYSTACK_SECRET_KEY is not set");
    return json({ error: "Server configuration error: Missing Paystack Secret" }, 500);
  }

  // Authenticate user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // Get user from token
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.error("Auth error:", userError);
    return json({ error: "Unauthorized" }, 401);
  }

  const userId = user.id;
  const userEmail = user.email;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ─── GET PUBLIC KEY ──────────────────────────────────────
    if (action === "public_key" && req.method === "GET") {
      const pk = Deno.env.get("PAYSTACK_PUBLIC_KEY");
      if (!pk) return json({ error: "Paystack public key not configured" }, 500);
      return json({ public_key: pk });
    }
    // ─── INITIALIZE ───────────────────────────────────────
    if (action === "initialize" && req.method === "POST") {
      const { amount, callback_url } = await req.json();
      const amountKobo = Math.round(Number(amount) * 100);

      if (!amountKobo || amountKobo < 10000) {
        return json({ error: "Minimum amount is ₦100" }, 400);
      }

      console.log(`Initializing payment of ${amount} for ${userEmail}`);

      const res = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            amount: amountKobo,
            callback_url,
            metadata: { user_id: userId },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.status) {
        console.error("Paystack Init Error:", data);
        return json({ error: data.message || "Paystack initialization failed" }, 400);
      }

      return json({
        authorization_url: data.data.authorization_url,
        reference: data.data.reference
      });
    }

    // ─── VERIFY ───────────────────────────────────────────
    if (action === "verify" && req.method === "POST") {
      const { reference } = await req.json();
      if (!reference) return json({ error: "Reference required" }, 400);

      console.log(`Verifying payment ref: ${reference}`);

      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
      );
      const data = await res.json();

      if (!res.ok || !data.status || data.data.status !== "success") {
        console.error("Paystack Verify Error:", data);
        return json({
          error: "Payment not successful",
          details: data.data?.gateway_response || data.message
        }, 400);
      }

      // Verify this payment belongs to the authenticated user
      const paystackMeta = data.data.metadata;
      if (paystackMeta?.user_id !== userId) {
        console.error("User ID mismatch:", { meta: paystackMeta?.user_id, current: userId });
        return json({ error: "Payment user mismatch" }, 403);
      }

      const amountNaira = data.data.amount / 100;

      // Use service role to credit wallet
      const adminClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Insert transaction (atomic check via unique reference)
      const { error: insertError } = await adminClient.from("transactions").insert({
        user_id: userId,
        type: "wallet_fund",
        amount: amountNaira,
        status: "success",
        reference,
        description: `Wallet funded via Paystack`,
        metadata: { paystack_reference: reference, channel: data.data.channel },
      });

      if (insertError) {
        if (insertError.code === "23505") { // Unique violation
          console.warn(`Payment ${reference} already processed`);
          return json({ error: "Payment already processed" }, 409);
        }
        console.error("Transaction Record Error:", insertError);
        return json({ error: "Failed to record transaction" }, 500);
      }

      // Credit wallet
      const { data: wallet, error: walletQueryErr } = await adminClient
        .from("wallets")
        .select("balance")
        .eq("id", userId)
        .single();

      if (walletQueryErr || !wallet) {
        console.error("Wallet missing, creating new one...");
        const { error: createWalletErr } = await adminClient.from("wallets").insert({
          id: userId,
          balance: amountNaira
        });
        if (createWalletErr) {
          console.error("Wallet creation error:", createWalletErr);
          return json({ error: "Failed to update wallet balance" }, 500);
        }
        return json({ message: "Wallet funded successfully", balance: amountNaira });
      }

      const newBalance = wallet.balance + amountNaira;
      const { error: updateErr } = await adminClient
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", userId);

      if (updateErr) {
        console.error("Wallet update error:", updateErr);
        return json({ error: "Failed to update wallet balance" }, 500);
      }

      return json({ message: "Wallet funded successfully", balance: newBalance });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Edge Function Error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
