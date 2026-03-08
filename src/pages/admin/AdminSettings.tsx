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
        }
    }, [config]);

    const saveMutation = useMutation({
        mutationFn: async () => {
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
