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

const KVDATA_BASE = "https://kvdataapi.net/api";

async function kvdataRequest(path: string, method: "GET" | "POST", body?: unknown) {
  const token = Deno.env.get("KVDATA_API_KEY");
  if (!token) throw new Error("KVDATA_API_KEY not configured");

  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body && method === "POST") opts.body = JSON.stringify(body);

  const url = `${KVDATA_BASE}${path}`;
  console.log(`KVData request: ${method} ${url}`);
  const res = await fetch(url, opts);
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error("Non-JSON response from KVData:", res.status, text.substring(0, 300));
    throw new Error(`KVData returned non-JSON response (status ${res.status}) for ${path}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
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

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { action, ...params } = await req.json();

    // === VALIDATE IUC ===
    if (action === "validate_iuc") {
      const { smart_card_number, cablename } = params;
      if (!cablename) return json({ error: "Invalid cable provider" }, 400);
      const data = await kvdataRequest(
        `/validateiuc?smart_card_number=${smart_card_number}&cablename=${cablename}`,
        "GET"
      );
      return json(data);
    }

    // === VALIDATE METER ===
    if (action === "validate_meter") {
      const { meter_number, disco_id, meter_type } = params;
      if (!disco_id) return json({ error: "Invalid disco" }, 400);
      const mtype = meter_type === "prepaid" ? 1 : 2;
      const data = await kvdataRequest(
        `/validatemeter?meternumber=${meter_number}&disconame=${disco_id}&mtype=${mtype}`,
        "GET"
      );
      return json(data);
    }

    // === GET DATA PLANS (from real API) ===
    if (action === "get_data_plans") {
      const data = await kvdataRequest("/data/", "GET");
      return json(data);
    }

    // === GET CABLE PLANS ===
    if (action === "get_cable_plans") {
      const data = await kvdataRequest("/cablesub/", "GET");
      return json(data);
    }

    // === GET EDU PLANS ===
    if (action === "get_edu_plans") {
      const data = await kvdataRequest("/epin/", "GET");
      return json(data);
    }

    // === GET DATACARD PLANS ===
    if (action === "get_datacard_plans") {
      const data = await kvdataRequest("/data_pin/", "GET");
      return json(data);
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

    let kvResult: any;
    let txType: string;
    let description: string;

    switch (action) {
      case "buy_airtime": {
        kvResult = await kvdataRequest("/topup/", "POST", {
          network: params.network_id,
          amount: numericAmount,
          mobile_number: params.phone,
          Ported_number: true,
          airtime_type: "VTU",
        });
        txType = "airtime";
        description = `${params.network_name || "Airtime"} ₦${numericAmount} - ${params.phone}`;
        break;
      }

      case "buy_data": {
        kvResult = await kvdataRequest("/data/", "POST", {
          network: params.network_id,
          mobile_number: params.phone,
          plan: params.plan_id,
          Ported_number: true,
        });
        txType = "data";
        description = `${params.network_name || "Data"} ${params.plan_label || "Bundle"} - ${params.phone}`;
        break;
      }

      case "buy_cable": {
        kvResult = await kvdataRequest("/cablesub/", "POST", {
          cablename: params.cable_id,
          cableplan: params.cableplan_id,
          smart_card_number: params.smart_card_number,
        });
        txType = "cable_tv";
        description = `${params.cable_name || "Cable"} ${params.plan_label || "Subscription"} - ${params.smart_card_number}`;
        break;
      }

      case "buy_electricity": {
        kvResult = await kvdataRequest("/billpayment/", "POST", {
          disco_name: params.disco_id,
          amount: numericAmount,
          meter_number: params.meter_number,
          MeterType: params.meter_type === "prepaid" ? 1 : 2,
        });
        txType = "electricity";
        description = `${params.disco_label || "Electricity"} ${params.meter_type} - Meter ${params.meter_number}`;
        break;
      }

      case "buy_edu_pin": {
        kvResult = await kvdataRequest("/epin/", "POST", {
          exam_name: params.exam_name,
          quantity: String(params.quantity || 1),
        });
        txType = "edu_pin";
        description = `${params.exam_name} Pin x${params.quantity || 1}`;
        break;
      }

      case "buy_data_card": {
        kvResult = await kvdataRequest("/data_pin/", "POST", {
          network: params.network_id,
          plan: params.plan_id,
          quantity: String(params.quantity || 1),
        });
        txType = "data_card";
        description = `Data Card ${params.plan_label || "PIN"} x${params.quantity || 1}`;
        break;
      }

      case "buy_bulk_sms": {
        // Bulk SMS — no provider API, just record the transaction
        txType = "bulk_sms";
        description = params.description || `Bulk SMS to ${params.recipients?.split(",").length || 0} recipients`;
        kvResult = { status: "success", message: "SMS queued" };
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

    // Record transaction — detect success from various KVData response shapes
    const kvStatus = (kvResult?.status || kvResult?.Status || "").toString().toLowerCase();
    const initialStatus = (kvStatus === "successful" || kvStatus === "success" || kvStatus === "delivered" || kvStatus === "completed") ? "success" : "pending";
    const kvReference = kvResult?.request_id || kvResult?.ident || kvResult?.id || kvResult?.reference;
    console.log("KVData response status:", kvResult?.status, kvResult?.Status, "=> mapped to:", initialStatus);

    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: txType as any,
        amount: numericAmount,
        status: initialStatus,
        description,
        reference: kvReference ? String(kvReference) : undefined,
        metadata: { kvdata_response: kvResult, ...params },
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
      kvdata: kvResult,
    });
  } catch (err: any) {
    console.error("KVData error:", err);
    return json({ error: err.message || "Service unavailable" }, 500);
  }
});
