import { useState } from "react";
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
    Shield,
    Settings,
    Bell,
    Globe,
    Lock,
    Save,
} from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [newSignupsEnabled, setNewSignupsEnabled] = useState(true);

    const handleSave = () => {
        toast.success("Platform settings updated successfully");
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
                <p className="text-sm text-slate-400">Global platform configuration and security controls</p>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            General Configuration
                        </CardTitle>
                        <CardDescription className="text-slate-400">Manage global platform behavior</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white">Maintenance Mode</Label>
                                <p className="text-xs text-slate-500">Temporarily disable user access for maintenance</p>
                            </div>
                            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white">Allow New Signups</Label>
                                <p className="text-xs text-slate-500">Enable or disable registration of new user accounts</p>
                            </div>
                            <Switch checked={newSignupsEnabled} onCheckedChange={setNewSignupsEnabled} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Platform Name</Label>
                            <Input defaultValue="UteelPay" className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-500" />
                            Security & Authentication
                        </CardTitle>
                        <CardDescription className="text-slate-400">RBAC and access control policies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white">Mandatory Two-Factor</Label>
                                <p className="text-xs text-slate-500">Require 2FA for all administrative accounts</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-white">Admin Session Timeout</Label>
                                <p className="text-xs text-slate-500">Automatically logout admins after inactivity</p>
                            </div>
                            <Select defaultValue="30m">
                                <SelectTrigger className="w-24 bg-slate-800 border-slate-700 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700">
                                    <SelectItem value="15m">15m</SelectItem>
                                    <SelectItem value="30m">30m</SelectItem>
                                    <SelectItem value="1h">1h</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 min-w-[150px]">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Placeholder for Select until implemented in core
const Select = ({ children }: any) => <div className="relative inline-block">{children}</div>;
const SelectTrigger = ({ children, className }: any) => <div className={className}>{children}</div>;
const SelectValue = () => <span>30m</span>;
const SelectContent = ({ children, className }: any) => <div className={className}>{children}</div>;
const SelectItem = ({ children }: any) => <div>{children}</div>;

export default AdminSettings;
