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

  const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Authenticate user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userId = claimsData.claims.sub as string;
  const userEmail = claimsData.claims.email as string;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ─── INITIALIZE ───────────────────────────────────────
    if (action === "initialize" && req.method === "POST") {
      const { amount, callback_url } = await req.json();
      const amountKobo = Math.round(Number(amount) * 100);

      if (!amountKobo || amountKobo < 10000) {
        return json({ error: "Minimum amount is ₦100" }, 400);
      }

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
      if (!data.status) {
        return json({ error: data.message || "Paystack error" }, 400);
      }
      return json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
    }

    // ─── VERIFY ───────────────────────────────────────────
    if (action === "verify" && req.method === "POST") {
      const { reference } = await req.json();
      if (!reference) return json({ error: "Reference required" }, 400);

      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
      );
      const data = await res.json();

      if (!data.status || data.data.status !== "success") {
        return json({ error: "Payment not successful", details: data.data?.gateway_response }, 400);
      }

      // Verify this payment belongs to the authenticated user
      const paystackMeta = data.data.metadata;
      if (paystackMeta?.user_id !== userId) {
        return json({ error: "Payment user mismatch" }, 403);
      }

      const amountNaira = data.data.amount / 100;

      // Use service role to credit wallet & record transaction
      const adminClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Insert transaction first (unique reference prevents duplicates atomically)
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
        // Unique constraint violation = already processed
        if (insertError.code === "23505") {
          return json({ error: "Payment already processed" }, 409);
        }
        return json({ error: insertError.message }, 500);
      }

      // Credit wallet atomically using RPC or read-then-update
      const { data: wallet } = await adminClient
        .from("wallets")
        .select("balance")
        .eq("id", userId)
        .single();

      const newBalance = (wallet?.balance ?? 0) + amountNaira;

      await adminClient
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", userId);

      return json({ message: "Wallet funded successfully", balance: newBalance });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
