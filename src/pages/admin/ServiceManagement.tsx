import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Smartphone, Tv, Zap, MessageSquare, GraduationCap, Package,
    Plus, Edit2, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2,
    Settings2, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const initialServices = [
    { id: 1, name: "Airtime", icon: Smartphone, status: "active", margin: 2.5, providers: 4, priority: "VTUKing", mode: "live" },
    { id: 2, name: "Data Bundles", icon: Smartphone, status: "active", margin: 5, providers: 4, priority: "VTUKing", mode: "live" },
    { id: 3, name: "Cable TV", icon: Tv, status: "active", margin: 4, providers: 3, priority: "Paystack", mode: "live" },
    { id: 4, name: "Electricity", icon: Zap, status: "active", margin: 3, providers: 11, priority: "Baxi", mode: "live" },
    { id: 5, name: "Bulk SMS", icon: MessageSquare, status: "maintenance", margin: 8, providers: 2, priority: "Termii", mode: "test" },
    { id: 6, name: "Edu Pins", icon: GraduationCap, status: "active", margin: 6, providers: 3, priority: "CowryWise", mode: "live" },
];

const apis = [
    { name: "Paystack (Fund Wallet)", status: "Online", latency: "118ms", uptime: "99.9%" },
    { name: "VTU King (Airtime/Data)", status: "Online", latency: "242ms", uptime: "98.7%" },
    { name: "Baxi (Electricity)", status: "Online", latency: "380ms", uptime: "97.2%" },
    { name: "Termii (Bulk SMS)", status: "Degraded", latency: "1200ms", uptime: "91.0%" },
    { name: "Monnify (Transfers)", status: "Offline", latency: "—", uptime: "0%" },
];

const ServiceManagement = () => {
    const [services, setServices] = useState(initialServices);
    const [editService, setEditService] = useState<any>(null);
    const [editMargin, setEditMargin] = useState("");

    const toggleStatus = (id: number) => {
        setServices((s) =>
            s.map((sv) =>
                sv.id === id ? { ...sv, status: sv.status === "active" ? "maintenance" : "active" } : sv
            )
        );
        toast.success("Service status updated");
    };

    const toggleMode = (id: number) => {
        setServices((s) =>
            s.map((sv) => sv.id === id ? { ...sv, mode: sv.mode === "live" ? "test" : "live" } : sv)
        );
        toast.success("Provider mode toggled");
    };

    const applyMargin = () => {
        const val = parseFloat(editMargin);
        if (isNaN(val) || val < 0 || val > 50) return toast.error("Enter a margin between 0–50%");
        setServices((s) => s.map((sv) => sv.id === editService.id ? { ...sv, margin: val } : sv));
        toast.success("Profit margin updated");
        setEditService(null);
        setEditMargin("");
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Service & Provider Control"
                description="Enable services, set margins, manage providers and toggle test/live mode"
                icon={Package}
                actions={
                    <Button size="sm">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Service
                    </Button>
                }
            />

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {services.map((service) => (
                    <div
                        key={service.id}
                        className={`bg-card border rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 ${service.status === "active" ? "border-border hover:border-primary/30" : "border-amber-200 bg-amber-50/30"
                            }`}
                    >
                        <div className="flex items-start justify-between mb-5">
                            <div className={`p-2.5 rounded-xl ${service.status === "active" ? "bg-primary/10" : "bg-amber-100"}`}>
                                <service.icon className={`w-5 h-5 ${service.status === "active" ? "text-primary" : "text-amber-600"}`} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={service.mode === "live" ? "text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]" : "text-amber-700 border-amber-200 bg-amber-50 text-[10px]"}>
                                    {service.mode === "live" ? "LIVE" : "TEST"}
                                </Badge>
                                <Badge variant="outline" className={service.status === "active" ? "text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]" : "text-amber-700 border-amber-200 bg-amber-50 text-[10px]"}>
                                    {service.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <h3 className="font-bold text-base mb-0.5">{service.name}</h3>
                        <p className="text-xs text-muted-foreground mb-4">{service.providers} providers · Priority: {service.priority}</p>

                        <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-accent/40 mb-5">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" /> Profit Margin
                            </span>
                            <span className="font-bold text-primary">{service.margin}%</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <Button variant="ghost" size="sm" onClick={() => toggleStatus(service.id)} className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                                {service.status === "active"
                                    ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                                    : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                                {service.status === "active" ? "Disable" : "Enable"}
                            </Button>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => toggleMode(service.id)}>
                                    <Settings2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditService(service); setEditMargin(String(service.margin)); }}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* API Status */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-base mb-5">External API Provider Health</h3>
                <div className="space-y-3">
                    {apis.map((api) => (
                        <div key={api.name} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${api.status === "Online" ? "bg-emerald-500 animate-pulse" : api.status === "Degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
                                <div>
                                    <p className="text-sm font-medium">{api.name}</p>
                                    <p className="text-[10px] text-muted-foreground">Uptime: {api.uptime}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-xs font-mono text-muted-foreground">{api.latency}</p>
                                <Badge variant="outline" className={
                                    api.status === "Online" ? "text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]"
                                        : api.status === "Degraded" ? "text-amber-700 border-amber-200 bg-amber-50 text-[10px]"
                                            : "text-red-700 border-red-200 bg-red-50 text-[10px]"
                                }>
                                    {api.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Margin Dialog */}
            <Dialog open={!!editService} onOpenChange={(o) => !o && setEditService(null)}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Edit Profit Margin – {editService?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-semibold text-muted-foreground block">New Margin (%)</label>
                        <Input type="number" min={0} max={50} value={editMargin} onChange={(e) => setEditMargin(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground">Enter a value between 0% and 50%</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditService(null)}>Cancel</Button>
                        <Button onClick={applyMargin}>Apply</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ServiceManagement;
