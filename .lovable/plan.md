

## Analysis

The edge function uses incorrect/fictional API endpoints. The logs confirm repeated 404s. Based on the real KVData API endpoints you provided, here are the issues:

**Current fictional endpoints (404ing):**
- `/sms-price/` -- does not exist
- `/cable-plans/` -- does not exist
- `/epin-plans/` -- does not exist
- `/datacard-plans/` -- does not exist
- `/electricity-discos/` -- does not exist

**Real endpoints from your list:**
- `/topup/` -- airtime purchase (already correct)
- `/data/` -- GET for data plans, POST for data purchase (already correct)
- `/data_pin/` -- data card/PIN purchase
- `/rechargepin/` -- recharge PIN
- `/epin/` -- edu pin purchase (already correct)
- `/billpayment/` -- electricity (already correct)
- `/cablesub/` -- cable subscription (already correct)
- `/cablesub/id` -- GET cable plans by ID
- `/validateiuc` -- validate IUC (already correct)
- `/validatemeter` -- validate meter (already correct)

## Plan

### 1. Fix base URL
Change `KVDATA_BASE` back to `https://kvdataapi.net/api` (without `www`), since that matches the real endpoints you provided.

### 2. Fix endpoint paths in the edge function

| Action | Current (broken) | Fix to |
|---|---|---|
| `get_cable_plans` | `/cable-plans/` | `/cablesub/` (or `/cablesub/{id}` per provider) |
| `get_edu_plans` | `/epin-plans/` | `/epin/` (GET) |
| `get_datacard_plans` | `/datacard-plans/` | `/data_pin/` (GET) |
| `get_sms_price` | `/sms-price/` | Remove or remap -- no matching endpoint exists |
| `get_electricity_discos` | `/electricity-discos/` | Remove -- use hardcoded disco list already in code |
| `buy_edu_pin` | `/epin/` | Keep (correct) |

### 3. Remove non-existent actions
- Remove `get_sms_price` handler (no real endpoint)
- Remove `get_electricity_discos` handler (disco list is already hardcoded in `DISCO_IDS`)

### 4. Update frontend pages
- Update `BulkSMS.tsx` to remove calls to `get_sms_price` since that endpoint doesn't exist
- Update any pages calling `get_electricity_discos` to use the hardcoded disco list instead
- Update pages calling `get_datacard_plans` and `get_cable_plans` to match new action names if needed

### 5. Redeploy edge function

