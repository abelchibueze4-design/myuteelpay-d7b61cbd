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
import {
    Shield,
    Globe,
    Save,
    Loader2,
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
        }
    }, [config]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const configData = {
                maintenance_mode: maintenanceMode,
                new_signups_enabled: newSignupsEnabled,
                platform_name: platformName,
                session_timeout: sessionTimeout,
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

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            Security & Authentication
                        </CardTitle>
                        <CardDescription>RBAC and access control policies</CardDescription>
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
