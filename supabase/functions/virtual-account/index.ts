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

function normalizePhone(raw: string): string {
  let phone = (raw || "").replace(/\D/g, "");
  if (phone.startsWith("234") && phone.length === 13) {
    phone = "0" + phone.slice(3);
  }
  if (phone.length !== 11) {
    phone = "08000000000";
  }
  return phone;
}

async function createForGateway(gateway: string, user: any, profile: any) {
  const customerName = profile?.full_name || user.user_metadata?.full_name || "Customer";
  const customerEmail = profile?.email || user.email || "";
  const customerPhone = normalizePhone(profile?.phone_number || user.user_metadata?.phone_number || "");

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
        accountType: "dynamic",
        amount: 50000,
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
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminDb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const callbackUrl = `${SUPABASE_URL}/functions/v1/webhooks?provider=xixapay`;
    const externalRef = `XX-${user.id.substring(0, 8)}-${Date.now()}`;

    const headers = {
      "Authorization": `Bearer ${XX_SECRET}`,
      "Content-Type": "application/json",
      "api-key": XX_API_KEY,
    };

    // Step 1: Check if xixapay_customer_id already exists in DB
    const { data: profileData } = await adminDb
      .from("profiles")
      .select("xixapay_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profileData?.xixapay_customer_id;

    // Step 2: If no customer_id, create one via XixaPay API
    if (!customerId) {
      const nameParts = (customerName || "Customer").trim().split(/\s+/);
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const customerPayload = {
        first_name: firstName,
        last_name: lastName,
        firstName,
        lastName,
        email: customerEmail,
        phoneNumber: customerPhone,
        phone_number: customerPhone,
        businessId: XX_BUSINESS_ID,
        address: profile?.address || "Nigeria",
        state: "Lagos",
        country: "Nigeria",
        gender: "M",
        dateOfBirth: "1990-01-01",
        dob: "1990-01-01",
      };

      const customerRes = await fetch("https://api.xixapay.com/api/customer/create", {
        method: "POST",
        headers,
        body: JSON.stringify(customerPayload),
      });

      const customerData = await customerRes.json();
      console.log("[virtual-account] XixaPay customer response:", JSON.stringify(customerData));

      customerId = customerData?.customer?.customer_id;
      if (!customerId) {
        return { error: customerData?.message || "XixaPay customer creation failed", accounts: [] };
      }

      // Save customer_id to profile for future use
      await adminDb
        .from("profiles")
        .update({ xixapay_customer_id: customerId })
        .eq("id", user.id);

      console.log("[virtual-account] Saved xixapay_customer_id:", customerId);
    } else {
      console.log("[virtual-account] Using stored xixapay_customer_id:", customerId);
    }

    // Step 3: Create virtual account using stored customer_id
      const vaRes = await fetch("https://api.xixapay.com/api/v1/createVirtualAccount", {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer_id: customerId,
          customerId,
        bankCode: ["20867", "29007", "20987"],
        businessId: XX_BUSINESS_ID,
        accountType: "static",
        externalReference: externalRef,
        callbackUrl,
      }),
    });

    const vaData = await vaRes.json();
    console.log("[virtual-account] XixaPay virtual account response:", JSON.stringify(vaData));

    const bankAccounts = vaData.bankAccounts || [];

    if (bankAccounts.length === 0) {
      return { error: vaData?.message || "XixaPay returned no bank accounts", accounts: [] };
    }

    return {
      reference: externalRef,
      accounts: bankAccounts.map((acc: any) => ({
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
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── GET_STATIC: Load from DB, generate if needed ──
    if (action === "get_static" && req.method === "POST") {
      const { gateways, forceRefresh } = await req.json();
      const gatewayList: string[] = gateways || [];

      if (gatewayList.length === 0) {
        return json({ bankAccounts: [] });
      }

      // If not force refresh, try loading from DB first
      if (!forceRefresh) {
        const { data: stored } = await adminClient
          .from("virtual_accounts")
          .select("bank_name, account_number, account_name, provider, gateway")
          .eq("user_id", user.id)
          .in("gateway", gatewayList);

        if (stored && stored.length > 0) {
          return json({
            bankAccounts: stored.map((a: any) => ({
              bankName: a.bank_name,
              accountNumber: a.account_number,
              accountName: a.account_name,
              provider: a.provider,
            })),
            source: "stored",
          });
        }
      }

      // Generate new accounts from APIs
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone_number, email")
        .eq("id", user.id)
        .single();

      const allAccounts: any[] = [];
      const errors: string[] = [];

      // If forceRefresh, delete old records first
      if (forceRefresh) {
        await adminClient
          .from("virtual_accounts")
          .delete()
          .eq("user_id", user.id)
          .in("gateway", gatewayList);
      }

      const results = await Promise.allSettled(
        gatewayList.map(gw => createForGateway(gw, user, profile))
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const gw = gatewayList[i];
        if (result.status === "fulfilled") {
          const r = result.value;
          if (r.accounts && r.accounts.length > 0) {
            // Save to DB
            for (const acc of r.accounts) {
              await adminClient.from("virtual_accounts").upsert({
                user_id: user.id,
                bank_name: acc.bankName,
                account_number: acc.accountNumber,
                account_name: acc.accountName,
                provider: acc.provider,
                gateway: gw,
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id,account_number,provider" });
            }
            allAccounts.push(...r.accounts);
          }
          if (r.error && r.accounts?.length === 0) {
            errors.push(r.error);
          }
        } else {
          errors.push(result.reason?.message || "Gateway error");
        }
      }

      if (allAccounts.length === 0 && errors.length > 0) {
        return json({ error: errors.join("; "), bankAccounts: [] }, 400);
      }

      return json({
        bankAccounts: allAccounts,
        source: "generated",
      });
    }

    // ── CREATE: Dynamic account for specific transaction ──
    if (action === "create" && req.method === "POST") {
      const { amount, gateway, gateways } = await req.json();

      if (!amount || amount < 100) {
        return json({ error: "Minimum amount is ₦100" }, 400);
      }

      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone_number, email")
        .eq("id", user.id)
        .single();

      const gatewayList: string[] = gateways || (gateway ? [gateway] : []);

      if (gatewayList.length === 0) {
        return json({ error: "No payment gateway specified" }, 400);
      }

      const allAccounts: any[] = [];
      const references: string[] = [];
      const errors: string[] = [];

      const results = await Promise.allSettled(
        gatewayList.map(gw => createForGateway(gw, user, profile))
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

      for (const ref of references) {
        const gw = ref.startsWith("PP-") ? "paymentpoint" : "xixapay";
        await adminClient.from("transactions").insert({
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

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[virtual-account] Error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
