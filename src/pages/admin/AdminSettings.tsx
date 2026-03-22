import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Shield,
    Globe,
    Save,
    Loader2,
    Lock,
    AlertTriangle,
    UserX,
    Ban,
    Eye,
    DollarSign,
    Activity,
    Server,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
    const queryClient = useQueryClient();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [newSignupsEnabled, setNewSignupsEnabled] = useState(true);
    const [platformName, setPlatformName] = useState("UteelPay");
    const [sessionTimeout, setSessionTimeout] = useState("30m");

    // Security settings
    const [forceTransactionPin, setForceTransactionPin] = useState(false);
    const [maxLoginAttempts, setMaxLoginAttempts] = useState("15");
    const [minPasswordLength, setMinPasswordLength] = useState("8");
    const [requireKycForTransactions, setRequireKycForTransactions] = useState(false);
    const [disableSuspiciousAccounts, setDisableSuspiciousAccounts] = useState(true);
    const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
    const [ipWhitelist, setIpWhitelist] = useState("");

    // Transaction limits
    const [maxDailyTransaction, setMaxDailyTransaction] = useState("100000");
    const [maxSingleTransaction, setMaxSingleTransaction] = useState("50000");
    const [minWalletFund, setMinWalletFund] = useState("100");

    // Service status banner
    const [serviceStatus, setServiceStatus] = useState<"operational" | "degraded" | "outage">("operational");
    const [serviceStatusMessage, setServiceStatusMessage] = useState("All services are running smoothly");
    const [serviceStatusVisible, setServiceStatusVisible] = useState(false);

    // API Provider settings
    const [airtimeProvider, setAirtimeProvider] = useState("vtpass");
    const [dataProvider, setDataProvider] = useState("vtpass");
    const [cableProvider, setCableProvider] = useState("vtpass");
    const [electricityProvider, setElectricityProvider] = useState("vtpass");
    const [eduPinsProvider, setEduPinsProvider] = useState("vtpass");
    const [dataCardProvider, setDataCardProvider] = useState("vtpass");
    const [exchangeRateMarkup, setExchangeRateMarkup] = useState("0");
    const [walletFundingFee, setWalletFundingFee] = useState("50");
    
    // Payment gateways multi-select
    const [paymentpointEnabled, setPaymentpointEnabled] = useState(true);
    
    const [paystackEnabled, setPaystackEnabled] = useState(false);
    
    // Load settings from DB
    const { data: config, isLoading } = useQuery({
        queryKey: ["admin_site_config"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_configurations")
                .select("*")
                .eq("platform", "admin_settings")
                .maybeSingle();
            if (error) throw error;
            return data;
        },
    });

    useEffect(() => {
        if (config?.config_data) {
            const d = config.config_data as Record<string, unknown>;
            setMaintenanceMode(d.maintenance_mode as boolean ?? false);
            setNewSignupsEnabled(d.new_signups_enabled as boolean ?? true);
            setPlatformName(d.platform_name as string ?? "UteelPay");
            setSessionTimeout(d.session_timeout as string ?? "30m");
            setForceTransactionPin(d.force_transaction_pin as boolean ?? false);
            setMaxLoginAttempts(String(d.max_login_attempts ?? "15"));
            setMinPasswordLength(String(d.min_password_length ?? "8"));
            setRequireKycForTransactions(d.require_kyc_for_transactions as boolean ?? false);
            setDisableSuspiciousAccounts(d.disable_suspicious_accounts as boolean ?? true);
            setIpWhitelistEnabled(d.ip_whitelist_enabled as boolean ?? false);
            setIpWhitelist(d.ip_whitelist as string ?? "");
            setMaxDailyTransaction(String(d.max_daily_transaction ?? "100000"));
            setMaxSingleTransaction(String(d.max_single_transaction ?? "50000"));
            setMinWalletFund(String(d.min_wallet_fund ?? "100"));
            setServiceStatus((d.service_status as "operational" | "degraded" | "outage") ?? "operational");
            setServiceStatusMessage(d.service_status_message as string ?? "All services are running smoothly");
            setServiceStatusVisible(d.service_status_visible as boolean ?? false);
            setAirtimeProvider(d.airtime_provider as string ?? "vtpass");
            setDataProvider(d.data_provider as string ?? "vtpass");
            setCableProvider(d.cable_provider as string ?? "vtpass");
            setElectricityProvider(d.electricity_provider as string ?? "vtpass");
            setEduPinsProvider(d.edu_pins_provider as string ?? "vtpass");
            setDataCardProvider(d.data_card_provider as string ?? "vtpass");
            setExchangeRateMarkup(String(d.exchange_rate_markup ?? "0"));
            setWalletFundingFee(String(d.wallet_funding_fee ?? "50"));
            
            // Multi-select gateways
            const enabledGateways = (d.payment_gateways_enabled as string[]) ?? ["paymentpoint"];
            setPaymentpointEnabled(enabledGateways.includes("paymentpoint"));
            setPaystackEnabled(d.paystack_enabled as boolean ?? false);
        }
    }, [config]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const enabledGateways: string[] = [];
            if (paymentpointEnabled) enabledGateways.push("paymentpoint");
            if (xixapayEnabled) enabledGateways.push("xixapay");

            const configData = {
                maintenance_mode: maintenanceMode,
                new_signups_enabled: newSignupsEnabled,
                platform_name: platformName,
                session_timeout: sessionTimeout,
                force_transaction_pin: forceTransactionPin,
                max_login_attempts: parseInt(maxLoginAttempts),
                min_password_length: parseInt(minPasswordLength),
                require_kyc_for_transactions: requireKycForTransactions,
                disable_suspicious_accounts: disableSuspiciousAccounts,
                ip_whitelist_enabled: ipWhitelistEnabled,
                ip_whitelist: ipWhitelist,
                max_daily_transaction: parseInt(maxDailyTransaction),
                max_single_transaction: parseInt(maxSingleTransaction),
                min_wallet_fund: parseInt(minWalletFund),
                service_status: serviceStatus,
                service_status_message: serviceStatusMessage,
                service_status_visible: serviceStatusVisible,
                airtime_provider: airtimeProvider,
                data_provider: dataProvider,
                cable_provider: cableProvider,
                electricity_provider: electricityProvider,
                edu_pins_provider: eduPinsProvider,
                data_card_provider: dataCardProvider,
                exchange_rate_markup: parseFloat(exchangeRateMarkup) || 0,
                wallet_funding_fee: parseFloat(walletFundingFee) || 50,
                payment_gateway: enabledGateways[0] || "paymentpoint",
                payment_gateways_enabled: enabledGateways,
                paystack_enabled: paystackEnabled,
            };

            if (config?.id) {
                const { error } = await supabase
                    .from("site_configurations")
                    .update({ config_data: configData as any })
                    .eq("id", config.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("site_configurations")
                    .insert({ platform: "admin_settings", config_data: configData as any });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_site_config"] });
            queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
            toast.success("Platform settings saved successfully");
        },
        onError: (err: Error) => {
            toast.error("Failed to save: " + err.message);
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold">Admin Settings</h1>
                <p className="text-sm text-muted-foreground">Global platform configuration and security controls</p>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            General Configuration
                        </CardTitle>
                        <CardDescription>Manage global platform behavior</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Maintenance Mode</Label>
                                <p className="text-xs text-muted-foreground">Temporarily disable user access for maintenance</p>
                            </div>
                            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Allow New Signups</Label>
                                <p className="text-xs text-muted-foreground">Enable or disable registration of new user accounts</p>
                            </div>
                            <Switch checked={newSignupsEnabled} onCheckedChange={setNewSignupsEnabled} />
                        </div>
                        <div className="space-y-2">
                            <Label>Platform Name</Label>
                            <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Security & Authentication */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            Security & Authentication
                        </CardTitle>
                        <CardDescription>Access control, session, and login policies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Admin Session Timeout</Label>
                                <p className="text-xs text-muted-foreground">Automatically logout admins after inactivity</p>
                            </div>
                            <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                                <SelectTrigger className="w-24 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15m">15m</SelectItem>
                                    <SelectItem value="30m">30m</SelectItem>
                                    <SelectItem value="1h">1h</SelectItem>
                                    <SelectItem value="2h">2h</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    Force Transaction PIN
                                </Label>
                                <p className="text-xs text-muted-foreground">Require all users to set a transaction PIN before making purchases</p>
                            </div>
                            <Switch checked={forceTransactionPin} onCheckedChange={setForceTransactionPin} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5" />
                                    Require KYC for Transactions
                                </Label>
                                <p className="text-xs text-muted-foreground">Users must complete KYC verification before transacting</p>
                            </div>
                            <Switch checked={requireKycForTransactions} onCheckedChange={setRequireKycForTransactions} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-1.5">
                                    <UserX className="w-3.5 h-3.5" />
                                    Auto-Disable Suspicious Accounts
                                </Label>
                                <p className="text-xs text-muted-foreground">Automatically deactivate accounts with suspicious activity</p>
                            </div>
                            <Switch checked={disableSuspiciousAccounts} onCheckedChange={setDisableSuspiciousAccounts} />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Max Login Attempts
                            </Label>
                            <p className="text-xs text-muted-foreground">Lock account after this many failed login attempts</p>
                            <Select value={maxLoginAttempts} onValueChange={setMaxLoginAttempts}>
                                <SelectTrigger className="w-24 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Minimum Password Length</Label>
                            <p className="text-xs text-muted-foreground">Enforce minimum password complexity for all users</p>
                            <Select value={minPasswordLength} onValueChange={setMinPasswordLength}>
                                <SelectTrigger className="w-24 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="8">8</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="12">12</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* IP Whitelist */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ban className="w-5 h-5 text-orange-500" />
                            IP Access Control
                        </CardTitle>
                        <CardDescription>Restrict admin panel access to specific IP addresses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable IP Whitelist</Label>
                                <p className="text-xs text-muted-foreground">Only allow admin access from whitelisted IPs</p>
                            </div>
                            <Switch checked={ipWhitelistEnabled} onCheckedChange={setIpWhitelistEnabled} />
                        </div>
                        {ipWhitelistEnabled && (
                            <div className="space-y-2">
                                <Label>Whitelisted IPs</Label>
                                <Input
                                    value={ipWhitelist}
                                    onChange={(e) => setIpWhitelist(e.target.value)}
                                    placeholder="e.g. 192.168.1.1, 10.0.0.1"
                                />
                                <p className="text-xs text-muted-foreground">Comma-separated list of allowed IP addresses</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Service Status Banner */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Service Status Banner
                        </CardTitle>
                        <CardDescription>Control the status message shown to all users on their dashboard</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Show Banner on Dashboard</Label>
                                <p className="text-xs text-muted-foreground">Toggle visibility of the status banner for all users</p>
                            </div>
                            <Switch checked={serviceStatusVisible} onCheckedChange={setServiceStatusVisible} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={serviceStatus} onValueChange={(v) => setServiceStatus(v as any)}>
                                <SelectTrigger className="w-48 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="operational">✅ Operational</SelectItem>
                                    <SelectItem value="degraded">⚠️ Degraded</SelectItem>
                                    <SelectItem value="outage">🔴 Outage</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status Message</Label>
                            <Textarea
                                value={serviceStatusMessage}
                                onChange={(e) => setServiceStatusMessage(e.target.value)}
                                placeholder="All services are running smoothly"
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction Limits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Transaction Limits
                        </CardTitle>
                        <CardDescription>Set spending caps and minimum funding amounts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Max Daily Transaction (₦)</Label>
                            <p className="text-xs text-muted-foreground">Maximum total amount a user can spend per day</p>
                            <Input
                                type="number"
                                value={maxDailyTransaction}
                                onChange={(e) => setMaxDailyTransaction(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Single Transaction (₦)</Label>
                            <p className="text-xs text-muted-foreground">Maximum amount for a single transaction</p>
                            <Input
                                type="number"
                                value={maxSingleTransaction}
                                onChange={(e) => setMaxSingleTransaction(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Minimum Wallet Fund (₦)</Label>
                            <p className="text-xs text-muted-foreground">Minimum amount users can deposit into their wallet</p>
                            <Input
                                type="number"
                                value={minWalletFund}
                                onChange={(e) => setMinWalletFund(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Exchange Rate & Fees */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-indigo-500" />
                            Exchange Rate & Fees
                        </CardTitle>
                        <CardDescription>Configure exchange rate markup and wallet funding fees</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Exchange Rate Markup (%)</Label>
                            <p className="text-xs text-muted-foreground">Percentage added on top of live exchange rates for international airtime</p>
                            <Input
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                value={exchangeRateMarkup}
                                onChange={(e) => setExchangeRateMarkup(e.target.value)}
                                placeholder="e.g. 10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Wallet Funding Fee (₦)</Label>
                            <p className="text-xs text-muted-foreground">Flat fee charged when users fund their wallet</p>
                            <Input
                                type="number"
                                min="0"
                                value={walletFundingFee}
                                onChange={(e) => setWalletFundingFee(e.target.value)}
                                placeholder="e.g. 50"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Payment Gateways</Label>
                            <p className="text-xs text-muted-foreground">Enable one or more payment gateways. All enabled gateways will display account details simultaneously to users.</p>
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="gw-paymentpoint"
                                        checked={paymentpointEnabled}
                                        onCheckedChange={(checked) => setPaymentpointEnabled(!!checked)}
                                    />
                                    <label htmlFor="gw-paymentpoint" className="text-sm font-medium cursor-pointer">
                                        PaymentPoint <span className="text-xs text-muted-foreground">(Bank Transfer)</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="gw-xixapay"
                                        checked={xixapayEnabled}
                                        onCheckedChange={(checked) => setXixapayEnabled(!!checked)}
                                    />
                                    <label htmlFor="gw-xixapay" className="text-sm font-medium cursor-pointer">
                                        XixaPay <span className="text-xs text-muted-foreground">(Bank Transfer)</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="gw-paystack"
                                        checked={paystackEnabled}
                                        onCheckedChange={(checked) => setPaystackEnabled(!!checked)}
                                    />
                                    <label htmlFor="gw-paystack" className="text-sm font-medium cursor-pointer">
                                        Paystack <span className="text-xs text-muted-foreground">(Card/Bank — currently disabled)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* API Provider Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-primary" />
                            API Provider Configuration
                        </CardTitle>
                        <CardDescription>Select which API provider to use for each service (KVData or VTPass)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: "Airtime", value: airtimeProvider, setter: setAirtimeProvider },
                            { label: "Data", value: dataProvider, setter: setDataProvider },
                            { label: "Cable TV", value: cableProvider, setter: setCableProvider },
                            { label: "Electricity", value: electricityProvider, setter: setElectricityProvider },
                            { label: "Education Pins", value: eduPinsProvider, setter: setEduPinsProvider },
                            { label: "Data Cards", value: dataCardProvider, setter: setDataCardProvider },
                            
                        ].map(({ label, value, setter }) => (
                            <div key={label} className="flex items-center justify-between">
                                <Label>{label}</Label>
                                <Select value={value} onValueChange={setter}>
                                    <SelectTrigger className="w-32 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vtpass">VTPass</SelectItem>
                                        <SelectItem value="kvdata">KVData</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="min-w-[150px]">
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {saveMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
