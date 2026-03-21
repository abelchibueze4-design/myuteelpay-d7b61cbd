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

async function createForGateway(gateway: string, amount: number, user: any, profile: any, isStatic: boolean = false) {
  const customerName = profile?.full_name || user.user_metadata?.full_name || "Customer";
  const customerEmail = profile?.email || user.email || "";
  let customerPhone = profile?.phone_number || user.user_metadata?.phone_number || "08000000000";
  
  // Ensure phone number is exactly 11 digits (Nigerian format)
  customerPhone = customerPhone.replace(/\D/g, "");
  if (customerPhone.startsWith("234") && customerPhone.length === 13) {
    customerPhone = "0" + customerPhone.slice(3);
  }
  if (customerPhone.length !== 11) {
    customerPhone = "08000000000";
  }

  if (gateway === "paymentpoint") {
    const PP_SECRET = Deno.env.get("PAYMENTPOINT_SECRET_KEY");
    const PP_API_KEY = Deno.env.get("PAYMENTPOINT_API_KEY");
    const PP_BUSINESS_ID = Deno.env.get("PAYMENTPOINT_BUSINESS_ID");

    if (!PP_SECRET || !PP_API_KEY || !PP_BUSINESS_ID) {
      return { error: "PaymentPoint is not configured", accounts: [] };
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
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
        accountType: isStatic ? "static" : "dynamic",
        amount: isStatic ? undefined : amount,
        externalReference: externalRef,
        callbackUrl: callbackUrl,
      }),
    });

    const data = await res.json();
    console.log("[virtual-account] PaymentPoint response:", JSON.stringify(data));

    if (!res.ok || data.status !== "success") {
      return { error: data.message || "PaymentPoint failed", accounts: [] };
    }

    return {
      reference: externalRef,
      accounts: (data.bankAccounts || []).map((acc: any) => ({
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        provider: "PaymentPoint",
      })),
    };
  }

  if (gateway === "xixapay") {
    const XX_SECRET = Deno.env.get("XIXAPAY_SECRET_KEY");
    const XX_API_KEY = Deno.env.get("XIXAPAY_API_KEY");
    const XX_BUSINESS_ID = Deno.env.get("XIXAPAY_BUSINESS_ID");

    if (!XX_SECRET || !XX_API_KEY || !XX_BUSINESS_ID) {
      return { error: "XixaPay is not configured", accounts: [] };
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
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
        bankCode: ["29007"],
        businessId: XX_BUSINESS_ID,
        accountType: isStatic ? "static" : "dynamic",
        amount: isStatic ? undefined : amount,
        externalReference: externalRef,
        callbackUrl: callbackUrl,
      }),
    });

    const data = await res.json();
    console.log("[virtual-account] XixaPay response:", JSON.stringify(data));

    if (!res.ok || data.status !== "success") {
      return { error: data.message || "XixaPay failed", accounts: [] };
    }

    return {
      reference: externalRef,
      accounts: (data.bankAccounts || []).map((acc: any) => ({
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        provider: "XixaPay",
      })),
    };
  }

  return { error: "Unknown gateway", accounts: [] };
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
      const { amount, gateway, gateways } = await req.json();

      if (!amount || amount < 100) {
        return json({ error: "Minimum amount is ₦100" }, 400);
      }

      // Get user profile
      const adminClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone_number, email")
        .eq("id", user.id)
        .single();

      // Multi-gateway mode
      const gatewayList: string[] = gateways || (gateway ? [gateway] : []);
      
      if (gatewayList.length === 0) {
        return json({ error: "No payment gateway specified" }, 400);
      }

      const allAccounts: any[] = [];
      const references: string[] = [];
      const errors: string[] = [];

      // Call all gateways in parallel
      const results = await Promise.allSettled(
        gatewayList.map(gw => createForGateway(gw, amount, user, profile, false))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          const r = result.value;
          if (r.accounts && r.accounts.length > 0) {
            allAccounts.push(...r.accounts);
            if (r.reference) references.push(r.reference);
          }
          if (r.error && r.accounts?.length === 0) {
            errors.push(r.error);
          }
        } else {
          errors.push(result.reason?.message || "Gateway error");
        }
      }

      if (allAccounts.length === 0) {
        return json({ error: errors.join("; ") || "All gateways failed" }, 400);
      }

      // Create pending transaction records for each reference
      const adminClient2 = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      for (const ref of references) {
        const gw = ref.startsWith("PP-") ? "paymentpoint" : "xixapay";
        await adminClient2.from("transactions").insert({
          user_id: user.id,
          type: "wallet_fund",
          amount: amount,
          status: "pending",
          reference: ref,
          description: `Wallet fund via ${gw} (pending bank transfer)`,
          metadata: { gateway: gw, bank_accounts: allAccounts.filter(a => 
            (gw === "paymentpoint" && a.provider === "PaymentPoint") ||
            (gw === "xixapay" && a.provider === "XixaPay")
          )},
        });
      }

      return json({
        gateways: gatewayList,
        references,
        amount,
        bankAccounts: allAccounts,
        message: "Transfer to any of the accounts below to fund your wallet",
        expiresIn: "30 minutes",
      });
    }

    if (action === "get_static" && req.method === "POST") {
      const { gateways, forceRefresh } = await req.json();

      const adminClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Check existing static accounts
      if (!forceRefresh) {
        const { data: existingAccounts } = await adminClient
          .from("user_virtual_accounts")
          .select("*")
          .eq("user_id", user.id);

        if (existingAccounts && existingAccounts.length > 0) {
          return json({
            bankAccounts: existingAccounts.map((acc: any) => ({
              bankName: acc.bank_name,
              accountNumber: acc.account_number,
              accountName: acc.account_name,
              provider: acc.provider,
            })),
          });
        }
      } else {
        // Clear existing to recreate
        await adminClient
          .from("user_virtual_accounts")
          .delete()
          .eq("user_id", user.id);
      }

      // No existing accounts, generate new ones
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone_number, email")
        .eq("id", user.id)
        .single();

      const gatewayList: string[] = gateways || ["paymentpoint"];
      const allAccounts: any[] = [];
      const errors: string[] = [];

      const results = await Promise.allSettled(
        gatewayList.map(gw => createForGateway(gw, 0, user, profile, true))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          const r = result.value;
          if (r.accounts && r.accounts.length > 0) {
            allAccounts.push(...r.accounts);
          }
          if (r.error && r.accounts?.length === 0) {
            errors.push(r.error);
          }
        } else {
          errors.push(result.reason?.message || "Gateway error");
        }
      }

      if (allAccounts.length === 0) {
        return json({ error: errors.join("; ") || "Failed to generate accounts" }, 400);
      }

      // Save them to database
      for (const acc of allAccounts) {
        await adminClient.from("user_virtual_accounts").insert({
          user_id: user.id,
          bank_name: acc.bankName,
          account_number: acc.accountNumber,
          account_name: acc.accountName,
          provider: acc.provider,
        });
      }

      return json({
        bankAccounts: allAccounts,
      });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[virtual-account] Error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
