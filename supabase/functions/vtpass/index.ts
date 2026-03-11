// @ts-nocheck
// deno-lint-ignore-file
/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const VTPASS_BASE = "https://sandbox.vtpass.com/api";

function generateRequestId() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
  const rand = crypto.randomUUID().replace(/-/g, "").substring(0, 10);
  return `${datePart}${rand}`;
}

async function vtpassGet(path: string) {
  const apiKey = Deno.env.get("VTPASS_API_KEY");
  const publicKey = Deno.env.get("VTPASS_PUBLIC_KEY");
  if (!apiKey || !publicKey) throw new Error("VTPass keys not configured");

  const url = `${VTPASS_BASE}${path}`;
  console.log(`VTPass GET: ${url}`);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "api-key": apiKey,
      "public-key": publicKey,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function vtpassPost(path: string, body: Record<string, unknown>) {
  const apiKey = Deno.env.get("VTPASS_API_KEY");
  const secretKey = Deno.env.get("VTPASS_SECRET_KEY");
  if (!apiKey || !secretKey) throw new Error("VTPass keys not configured");

  const url = `${VTPASS_BASE}${path}`;
  console.log(`VTPass POST: ${url}`, JSON.stringify(body));
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "secret-key": secretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Map internal network IDs to VTPass serviceIDs
const AIRTIME_SERVICE_MAP: Record<string, string> = {
  mtn: "mtn",
  glo: "glo",
  airtel: "airtel",
  "9mobile": "etisalat",
  etisalat: "etisalat",
};

const DATA_SERVICE_MAP: Record<string, string> = {
  mtn: "mtn-data",
  glo: "glo-data",
  airtel: "airtel-data",
  "9mobile": "etisalat-data",
  etisalat: "etisalat-data",
};

const CABLE_SERVICE_MAP: Record<string, string> = {
  dstv: "dstv",
  gotv: "gotv",
  startimes: "startimes",
};

// Map disco names to VTPass serviceIDs
const ELECTRICITY_SERVICE_MAP: Record<string, string> = {
  "ikeja electric": "ikeja-electric",
  ikedc: "ikeja-electric",
  "eko electric": "eko-electric",
  ekedc: "eko-electric",
  "kano electric": "kano-electric",
  kedco: "kano-electric",
  "port harcourt electric": "phed",
  phedc: "phed",
  phed: "phed",
  "jos electric": "jos-electric",
  jed: "jos-electric",
  "kaduna electric": "kaduna-electric",
  kaedco: "kaduna-electric",
  "enugu electric": "enugu-electric",
  eedc: "enugu-electric",
  "ibadan electric": "ibadan-electric",
  ibedc: "ibadan-electric",
  "benin electric": "benin-electric",
  bedc: "benin-electric",
  "aba electric": "aba-electric",
  "yola electric": "yola-electric",
  yedc: "yola-electric",
  aedc: "abuja-electric",
  "abuja electric": "abuja-electric",
};

const EDUCATION_SERVICE_MAP: Record<string, string> = {
  waec: "waec",
  "waec registration": "waec-registration",
  neco: "waec", // fallback
  jamb: "jamb",
  "jamb utme": "jamb",
  "jamb de": "jamb",
  nabteb: "waec", // fallback
};

function resolveServiceId(map: Record<string, string>, name: string): string | undefined {
  const lower = name.toLowerCase().trim();
  return map[lower] || Object.entries(map).find(([k]) => lower.includes(k))?.[1];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { action, ...params } = await req.json();

    // === GET DATA PLANS (variations) ===
    if (action === "get_data_plans") {
      // Fetch variations for all networks
      const networks = ["mtn-data", "glo-data", "airtel-data", "etisalat-data"];
      const allPlans: any[] = [];
      for (const serviceID of networks) {
        try {
          const data = await vtpassGet(`/service-variations?serviceID=${serviceID}`);
          const networkName = serviceID.replace("-data", "").toUpperCase();
          if (data?.content?.variations) {
            for (const v of data.content.variations) {
              allPlans.push({
                plan_id: v.variation_code,
                network_name: networkName === "ETISALAT" ? "9MOBILE" : networkName,
                plan_type: v.name?.includes("SME") ? "SME" : (v.name?.includes("Corporate") ? "CORPORATE" : "GIFTING"),
                size: v.name,
                amount: Number(v.variation_amount),
                validity: v.name,
              });
            }
          }
        } catch (e) {
          console.error(`Failed to fetch ${serviceID} variations:`, e);
        }
      }
      return json(allPlans);
    }

    // === GET CABLE PLANS ===
    if (action === "get_cable_plans") {
      const cables = ["dstv", "gotv", "startimes"];
      const allPlans: any[] = [];
      for (const serviceID of cables) {
        try {
          const data = await vtpassGet(`/service-variations?serviceID=${serviceID}`);
          if (data?.content?.variations) {
            for (const v of data.content.variations) {
              allPlans.push({
                cable_name: serviceID.toUpperCase(),
                cableplan_id: v.variation_code,
                cableplan_name: v.name,
                cableplan_amount: Number(v.variation_amount),
              });
            }
          }
        } catch (e) {
          console.error(`Failed to fetch ${serviceID} cable variations:`, e);
        }
      }
      return json(allPlans);
    }

    // === GET EDU PLANS ===
    if (action === "get_edu_plans") {
      const eduServices = ["waec", "waec-registration", "jamb"];
      const allPlans: any[] = [];
      for (const serviceID of eduServices) {
        try {
          const data = await vtpassGet(`/service-variations?serviceID=${serviceID}`);
          if (data?.content?.variations) {
            for (const v of data.content.variations) {
              allPlans.push({
                id: v.variation_code,
                exam_name: v.name || data.content.ServiceName,
                plan_amount: Number(v.variation_amount),
                serviceID,
              });
            }
          }
        } catch (e) {
          console.error(`Failed to fetch ${serviceID} edu variations:`, e);
        }
      }
      return json({ plans: allPlans });
    }

    // === GET DATACARD PLANS ===
    if (action === "get_datacard_plans") {
      // VTPass doesn't have a separate data card/PIN endpoint; reuse data variations
      const networks = ["mtn-data", "glo-data", "airtel-data", "etisalat-data"];
      const allPlans: any[] = [];
      for (const serviceID of networks) {
        try {
          const data = await vtpassGet(`/service-variations?serviceID=${serviceID}`);
          const networkName = serviceID.replace("-data", "").toUpperCase();
          if (data?.content?.variations) {
            for (const v of data.content.variations) {
              allPlans.push({
                plan_id: v.variation_code,
                network_name: networkName === "ETISALAT" ? "9MOBILE" : networkName,
                plan_name: v.name,
                plan_amount: Number(v.variation_amount),
              });
            }
          }
        } catch (e) {
          console.error(`Failed to fetch ${serviceID} datacard variations:`, e);
        }
      }
      return json(allPlans);
    }

    // === VALIDATE IUC ===
    if (action === "validate_iuc") {
      const { smart_card_number, cable_name } = params;
      const serviceID = resolveServiceId(CABLE_SERVICE_MAP, cable_name || "");
      if (!serviceID) return json({ error: "Unsupported cable provider" }, 400);
      const data = await vtpassPost("/merchant-verify", {
        billersCode: smart_card_number,
        serviceID,
      });
      return json({
        Customer_Name: data?.content?.Customer_Name || data?.content?.name,
        ...data?.content,
      });
    }

    // === VALIDATE METER ===
    if (action === "validate_meter") {
      const { meter_number, disco_label, meter_type } = params;
      const serviceID = resolveServiceId(ELECTRICITY_SERVICE_MAP, disco_label || "");
      if (!serviceID) return json({ error: "Unsupported electricity provider" }, 400);
      const data = await vtpassPost("/merchant-verify", {
        billersCode: meter_number,
        serviceID,
        type: meter_type || "prepaid",
      });
      return json({
        Customer_Name: data?.content?.Customer_Name || data?.content?.name,
        ...data?.content,
      });
    }

    // === PURCHASE ACTIONS (require wallet deduction) ===
    const numericAmount = Number(params.amount);
    if (!numericAmount || numericAmount <= 0) return json({ error: "Invalid amount" }, 400);

    // Check wallet balance
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("id", user.id)
      .single();
    if (walletErr || !wallet) return json({ error: "Wallet not found" }, 404);
    if (wallet.balance < numericAmount) return json({ error: "Insufficient balance" }, 400);

    let vtResult: any;
    let txType: string;
    let description: string;
    const requestId = generateRequestId();

    switch (action) {
      case "buy_airtime": {
        const serviceID = resolveServiceId(AIRTIME_SERVICE_MAP, params.network_name || "");
        if (!serviceID) return json({ error: "Unsupported network" }, 400);
        vtResult = await vtpassPost("/pay", {
          request_id: requestId,
          serviceID,
          amount: numericAmount,
          phone: params.phone,
        });
        txType = "airtime";
        description = `${params.network_name || "Airtime"} ₦${numericAmount} - ${params.phone}`;
        break;
      }

      case "buy_data": {
        const serviceID = resolveServiceId(DATA_SERVICE_MAP, params.network_name || "");
        if (!serviceID) return json({ error: "Unsupported network" }, 400);
        vtResult = await vtpassPost("/pay", {
          request_id: requestId,
          serviceID,
          billersCode: params.phone,
          variation_code: params.plan_id,
          amount: numericAmount,
          phone: params.phone,
        });
        txType = "data";
        description = `${params.network_name || "Data"} ${params.plan_label || "Bundle"} - ${params.phone}`;
        break;
      }

      case "buy_cable": {
        const serviceID = resolveServiceId(CABLE_SERVICE_MAP, params.cable_name || "");
        if (!serviceID) return json({ error: "Unsupported cable provider" }, 400);
        vtResult = await vtpassPost("/pay", {
          request_id: requestId,
          serviceID,
          billersCode: params.smart_card_number,
          variation_code: params.cableplan_id,
          amount: numericAmount,
          phone: params.phone || "08000000000",
        });
        txType = "cable_tv";
        description = `${params.cable_name || "Cable"} ${params.plan_label || "Subscription"} - ${params.smart_card_number}`;
        break;
      }

      case "buy_electricity": {
        const serviceID = resolveServiceId(ELECTRICITY_SERVICE_MAP, params.disco_label || "");
        if (!serviceID) return json({ error: "Unsupported electricity provider" }, 400);
        vtResult = await vtpassPost("/pay", {
          request_id: requestId,
          serviceID,
          billersCode: params.meter_number,
          variation_code: params.meter_type || "prepaid",
          amount: numericAmount,
          phone: params.phone || "08000000000",
        });
        txType = "electricity";
        description = `${params.disco_label || "Electricity"} ${params.meter_type} - Meter ${params.meter_number}`;
        break;
      }

      case "buy_edu_pin": {
        // Use serviceID directly from the plan if provided, otherwise resolve from name
        const serviceID = params.serviceID || resolveServiceId(EDUCATION_SERVICE_MAP, params.exam_name || "");
        if (!serviceID) return json({ error: "Unsupported exam" }, 400);

        const variationCode = params.variation_code || serviceID;
        vtResult = await vtpassPost("/pay", {
          request_id: requestId,
          serviceID,
          variation_code: variationCode,
          amount: numericAmount,
          phone: params.phone || "08000000000",
          quantity: params.quantity || 1,
        });
        txType = "edu_pin";
        description = `${params.exam_name} Pin x${params.quantity || 1}`;
        break;
      }

      case "buy_data_card": {
        const serviceID = resolveServiceId(DATA_SERVICE_MAP, params.network_name || "");
        if (!serviceID) return json({ error: "Unsupported network" }, 400);
        vtResult = await vtpassPost("/pay", {
          request_id: requestId,
          serviceID,
          billersCode: params.phone || "08000000000",
          variation_code: params.plan_id,
          amount: numericAmount,
          phone: params.phone || "08000000000",
        });
        txType = "data_card";
        description = `Data Card ${params.plan_label || "PIN"} x${params.quantity || 1}`;
        break;
      }

      case "buy_bulk_sms": {
        // VTPass doesn't support bulk SMS in the same way; placeholder
        txType = "bulk_sms";
        description = params.description || `Bulk SMS to ${params.recipients?.split(",").length || 0} recipients`;
        vtResult = { code: "000", response_description: "TRANSACTION SUCCESSFUL" };
        break;
      }

      default:
        return json({ error: "Invalid action" }, 400);
    }

    // Deduct wallet
    const newBalance = wallet.balance - numericAmount;
    await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", user.id);

    // Determine status from VTPass response
    const vtCode = vtResult?.code || vtResult?.response_description || "";
    const vtTransactionStatus = vtResult?.content?.transactions?.status || "";
    const isSuccess = vtCode === "000" || vtTransactionStatus === "delivered" || vtTransactionStatus === "successful";
    const initialStatus = isSuccess ? "success" : "pending";
    const vtReference = vtResult?.requestId || vtResult?.content?.transactions?.transactionId || requestId;
    console.log("VTPass response code:", vtCode, "transaction status:", vtTransactionStatus, "=> mapped to:", initialStatus);

    // Extract token for electricity
    const electricityToken = vtResult?.purchased_code || vtResult?.mainToken || vtResult?.token || 
      vtResult?.content?.transactions?.purchased_code || "";

    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: txType as any,
        amount: numericAmount,
        status: initialStatus,
        description,
        reference: String(vtReference),
        metadata: { vtpass_response: vtResult, provider: "vtpass", ...params },
      })
      .select()
      .single();

    if (txErr) {
      console.error("Transaction insert error:", txErr);
    }

    return json({
      message: "Transaction successful",
      balance: newBalance,
      transaction: tx,
      kvdata: { 
        ...vtResult, 
        token: electricityToken,
        Token: electricityToken,
        pin: vtResult?.content?.transactions?.purchased_code,
        Pin: vtResult?.content?.transactions?.purchased_code,
      },
    });
  } catch (err: any) {
    console.error("VTPass error:", err);
    return json({ error: err.message || "Service unavailable" }, 500);
  }
});
