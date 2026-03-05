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

  const res = await fetch(`${KVDATA_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Network name -> KVData network ID
const NETWORK_IDS: Record<string, number> = {
  MTN: 1,
  Glo: 2,
  Airtel: 3,
  "9mobile": 4,
};

// Disco name -> KVData disco ID mapping
const DISCO_IDS: Record<string, number> = {
  IKEDC: 1,
  EKEDC: 2,
  KEDCO: 3,
  PHEDC: 4,
  JEDC: 5,
  IBEDC: 6,
  KAEDCO: 7,
  AEDC: 8,
  BEDC: 9,
};

// Cable name -> KVData cable ID
const CABLE_IDS: Record<string, number> = {
  DSTV: 1,
  GOTV: 2,
  StarTimes: 3,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
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
      const cableId = CABLE_IDS[cablename];
      if (!cableId) return json({ error: "Invalid cable provider" }, 400);
      const data = await kvdataRequest(
        `/validateiuc?smart_card_number=${smart_card_number}&cablename=${cableId}`,
        "GET"
      );
      return json(data);
    }

    // === GET DATA PLANS ===
    if (action === "get_data_plans") {
      const data = await kvdataRequest("/data/", "GET");
      return json(data);
    }

    // === GET CABLE PLANS ===
    if (action === "get_cable_plans") {
      const data = await kvdataRequest("/cable-plans/", "GET");
      return json(data);
    }

    // === GET EDU PLANS ===
    if (action === "get_edu_plans") {
      const data = await kvdataRequest("/epin-plans/", "GET");
      return json(data);
    }

    // === GET DATACARD PLANS ===
    if (action === "get_datacard_plans") {
      const data = await kvdataRequest("/datacard-plans/", "GET");
      return json(data);
    }

    // === GET SMS PRICE ===
    if (action === "get_sms_price") {
      const data = await kvdataRequest("/sms-price/", "GET");
      return json(data);
    }

    // === GET ELECTRICITY DISCOS ===
    if (action === "get_electricity_discos") {
      const data = await kvdataRequest("/electricity-discos/", "GET");
      return json(data);
    }

    // === VALIDATE METER ===
    if (action === "validate_meter") {
      const { meter_number, disco_name, meter_type } = params;
      const discoId = DISCO_IDS[disco_name];
      if (!discoId) return json({ error: "Invalid disco" }, 400);
      const mtype = meter_type === "prepaid" ? 1 : 2;
      const data = await kvdataRequest(
        `/validatemeter?meternumber=${meter_number}&disconame=${discoId}&mtype=${mtype}`,
        "GET"
      );
      return json(data);
    }

    // === PURCHASE ACTIONS (require wallet deduction) ===
    const { amount } = params;
    if (!amount || amount <= 0) return json({ error: "Invalid amount" }, 400);

    // Check wallet balance
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("id", user.id)
      .single();
    if (walletErr || !wallet) return json({ error: "Wallet not found" }, 404);
    if (wallet.balance < amount) return json({ error: "Insufficient balance" }, 400);

    let kvResult: any;
    let txType: string;
    let description: string;

    switch (action) {
      case "buy_airtime": {
        const networkId = NETWORK_IDS[params.network];
        if (!networkId) return json({ error: "Invalid network" }, 400);
        kvResult = await kvdataRequest("/topup/", "POST", {
          network: networkId,
          amount: params.amount,
          mobile_number: params.phone,
          Ported_number: true,
          airtime_type: "VTU",
        });
        txType = "airtime";
        description = `${params.network} Airtime ₦${amount} - ${params.phone}`;
        break;
      }

      case "buy_data": {
        const networkId = NETWORK_IDS[params.network];
        if (!networkId) return json({ error: "Invalid network" }, 400);
        kvResult = await kvdataRequest("/data/", "POST", {
          network: networkId,
          mobile_number: params.phone,
          plan: params.plan_id,
          Ported_number: true,
        });
        txType = "data";
        description = `${params.network} ${params.plan_label || "Data"} - ${params.phone}`;
        break;
      }

      case "buy_cable": {
        const cableId = CABLE_IDS[params.cablename];
        if (!cableId) return json({ error: "Invalid cable provider" }, 400);
        kvResult = await kvdataRequest("/cablesub/", "POST", {
          cablename: cableId,
          cableplan: params.cableplan_id,
          smart_card_number: params.smart_card_number,
        });
        txType = "cable_tv";
        description = `${params.cablename} ${params.plan_label || "Subscription"} - ${params.smart_card_number}`;
        break;
      }

      case "buy_electricity": {
        const discoId = DISCO_IDS[params.disco_name];
        if (!discoId) return json({ error: "Invalid disco" }, 400);
        kvResult = await kvdataRequest("/billpayment/", "POST", {
          disco_name: discoId,
          amount: params.amount,
          meter_number: params.meter_number,
          MeterType: params.meter_type === "prepaid" ? 1 : 2,
        });
        txType = "electricity";
        description = `${params.disco_name} ${params.meter_type} - Meter ${params.meter_number}`;
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

      default:
        return json({ error: "Invalid action" }, 400);
    }

    // Deduct wallet
    const newBalance = wallet.balance - amount;
    await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", user.id);

    // Record transaction
    const initialStatus = (kvResult?.status === "Successful" || kvResult?.Status === "Successful") ? "success" : "pending";
    const kvReference = kvResult?.request_id || kvResult?.id || kvResult?.reference;

    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: txType as any,
        amount,
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
