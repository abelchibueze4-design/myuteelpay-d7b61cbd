import { useState } from "react";
import {
    Smartphone,
    Tv,
    Zap,
    MessageSquare,
    GraduationCap,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const initialServices = [
    { id: 1, name: "Airtime", icon: Smartphone, status: "active", providers: 4, usage: "High" },
    { id: 2, name: "Data Bundles", icon: Smartphone, status: "active", providers: 4, usage: "Medium" },
    { id: 3, name: "Cable TV", icon: Tv, status: "active", providers: 3, usage: "Low" },
    { id: 4, name: "Electricity", icon: Zap, status: "active", providers: 11, usage: "Medium" },
    { id: 5, name: "Bulk SMS", icon: MessageSquare, status: "maintenance", providers: 2, usage: "N/A" },
    { id: 6, name: "Edu Pins", icon: GraduationCap, status: "active", providers: 3, usage: "Low" },
];

const ServiceManagement = () => {
    const [services, setServices] = useState(initialServices);

    const toggleStatus = (id: number) => {
        setServices(services.map(s =>
            s.id === id ? { ...s, status: s.status === "active" ? "maintenance" : "active" } : s
        ));
        toast.success("Service status updated");
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Service Management</h1>
                    <p className="text-sm text-slate-400">Monitor and configure platform services and providers</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                    <div key={service.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-primary/30 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <service.icon className="w-6 h-6" />
                            </div>
                            <Badge className={service.status === "active" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}>
                                {service.status.toUpperCase()}
                            </Badge>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
                        <p className="text-xs text-slate-500 mb-6">{service.providers} API Providers connected</p>

                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-slate-400" />
                                <span className="text-xs text-slate-300">Usage Trend</span>
                            </div>
                            <span className={`text-xs font-bold ${service.usage === "High" ? "text-green-400" : "text-slate-400"}`}>
                                {service.usage}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => toggleStatus(service.id)}>
                                {service.status === "active" ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* API Status Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8">
                <h3 className="font-bold text-white mb-4">External API Providers Status</h3>
                <div className="space-y-4">
                    {[
                        { name: "Paystack (Fund Wallet)", status: "Online", latency: "120ms" },
                        { name: "VTU King (Airtime/Data)", status: "Online", latency: "250ms" },
                        { name: "Monnify (Transfers)", status: "Offline", latency: "-" },
                    ].map((api) => (
                        <div key={api.name} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${api.status === "Online" ? "bg-green-500" : "bg-red-500"}`} />
                                <span className="text-sm font-medium text-slate-200">{api.name}</span>
                            </div>
                            <div className="text-xs text-slate-500">Latency: {api.latency}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServiceManagement;
