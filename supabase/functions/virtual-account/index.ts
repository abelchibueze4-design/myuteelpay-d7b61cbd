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
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "create" && req.method === "POST") {
      const { amount, gateway } = await req.json();

      if (!amount || amount < 100) {
        return json({ error: "Minimum amount is ₦100" }, 400);
      }

      if (!gateway || !["paymentpoint", "xixapay"].includes(gateway)) {
        return json({ error: "Invalid payment gateway" }, 400);
      }

      // Get user profile for customer details
      const adminClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone_number, email")
        .eq("id", user.id)
        .single();

      const customerName = profile?.full_name || user.user_metadata?.full_name || "Customer";
      const customerEmail = profile?.email || user.email || "";
      const customerPhone = profile?.phone_number || user.user_metadata?.phone_number || "08000000000";

      let bankAccounts: any[] = [];
      let transactionRef = "";

      if (gateway === "paymentpoint") {
        const PP_SECRET = Deno.env.get("PAYMENTPOINT_SECRET_KEY");
        const PP_API_KEY = Deno.env.get("PAYMENTPOINT_API_KEY");
        const PP_BUSINESS_ID = Deno.env.get("PAYMENTPOINT_BUSINESS_ID");

        if (!PP_SECRET || !PP_API_KEY || !PP_BUSINESS_ID) {
          return json({ error: "PaymentPoint is not configured" }, 500);
        }

        const callbackUrl = `${SUPABASE_URL}/functions/v1/webhooks?provider=paymentpoint`;
        const externalRef = `PP-${user.id.substring(0, 8)}-${Date.now()}`;

        const res = await fetch("https://api.paymentpoint.co/api/v1/createVirtualAccount", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${PP_SECRET}`,
            "Content-Type": "application/json",
            "api-key": PP_API_KEY,
          },
          body: JSON.stringify({
            email: customerEmail,
            name: customerName,
            phoneNumber: customerPhone,
            bankCode: ["20946", "20897"],
            businessId: PP_BUSINESS_ID,
            accountType: "dynamic",
            amount: amount,
            externalReference: externalRef,
            callbackUrl: callbackUrl,
          }),
        });

        const data = await res.json();
        console.log("[virtual-account] PaymentPoint response:", JSON.stringify(data));

        if (!res.ok || data.status !== "success") {
          return json({ error: data.message || "Failed to create virtual account" }, 400);
        }

        bankAccounts = (data.bankAccounts || []).map((acc: any) => ({
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          accountName: acc.accountName,
        }));
        transactionRef = externalRef;

      } else if (gateway === "xixapay") {
        const XX_SECRET = Deno.env.get("XIXAPAY_SECRET_KEY");
        const XX_API_KEY = Deno.env.get("XIXAPAY_API_KEY");

        if (!XX_SECRET || !XX_API_KEY) {
          return json({ error: "XixaPay is not configured" }, 500);
        }

        const callbackUrl = `${SUPABASE_URL}/functions/v1/webhooks?provider=xixapay`;
        const externalRef = `XX-${user.id.substring(0, 8)}-${Date.now()}`;

        const res = await fetch("https://api.xixapay.com/api/v1/createVirtualAccount", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${XX_SECRET}`,
            "Content-Type": "application/json",
            "api-key": XX_API_KEY,
          },
          body: JSON.stringify({
            email: customerEmail,
            name: customerName,
            phoneNumber: customerPhone,
            bankCode: ["20867"],
            businessId: XX_API_KEY,
            accountType: "dynamic",
            amount: amount,
            externalReference: externalRef,
            callbackUrl: callbackUrl,
          }),
        });

        const data = await res.json();
        console.log("[virtual-account] XixaPay response:", JSON.stringify(data));

        if (!res.ok || data.status !== "success") {
          return json({ error: data.message || "Failed to create virtual account" }, 400);
        }

        bankAccounts = (data.bankAccounts || []).map((acc: any) => ({
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          accountName: acc.accountName,
        }));
        transactionRef = externalRef;
      }

      // Create a pending transaction record
      const adminClient2 = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await adminClient2.from("transactions").insert({
        user_id: user.id,
        type: "wallet_fund",
        amount: amount,
        status: "pending",
        reference: transactionRef,
        description: `Wallet fund via ${gateway} (pending bank transfer)`,
        metadata: { gateway, bank_accounts: bankAccounts },
      });

      return json({
        gateway,
        reference: transactionRef,
        amount,
        bankAccounts,
        message: "Transfer to any of the accounts below to fund your wallet",
        expiresIn: "30 minutes",
      });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[virtual-account] Error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
