import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Check, Loader2, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata, useKvdataQuery } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { DataPrices } from "@/components/services/DataPrices";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Data = () => {
    const navigate = useNavigate();
    const [network, setNetwork] = useState<any>(null);
    const [category, setCategory] = useState("");
    const [phone, setPhone] = useState("");
    const [planId, setPlanId] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [pinOpen, setPinOpen] = useState(false);
    
    const kvdata = useKvdata();
    const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();

    const { data: networks } = useQuery({
        queryKey: ["networks"],
        queryFn: async () => {
            const { data, error } = await supabase.from("networks").select("*").eq("is_active", true).order("name");
            if (error) throw error;
            return data;
        }
    });

    const { data: categories } = useQuery({
        queryKey: ["categories", network?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("data_plans")
                .select("type")
                .eq("network_id", network.id)
                .eq("is_active", true);
            
            if (error) throw error;
            // Get unique types
            const types = new Set(data.map(p => p.type));
            return Array.from(types);
        },
        enabled: !!network
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!network || !phone || !planId) return;
        setPinOpen(true);
    };

    const handleConfirmPurchase = async (pin: string) => {
        const isValid = await verifyPin(pin);
        if (!isValid) return false;

        if (!selectedPlan) return false;

        try {
            await kvdata.mutateAsync({
                action: "buy_data",
                network: network.provider_id,
                network_name: network.name,
                phone,
                plan_id: selectedPlan.plan_id, // Use the KVData plan ID
                plan_label: selectedPlan.label,
                amount: selectedPlan.price,
            });
            setShowSuccess(true);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-secondary pb-12">
            <div className="gradient-hero px-4 py-6 mb-6">
                <div className="container mx-auto">
                    <h1 className="text-lg font-bold text-primary-foreground">Buy Data</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-2xl">
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
                    {/* Network Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Network</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {networks?.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => { setNetwork(n); setCategory(""); setPlanId(""); setSelectedPlan(null); }}
                                    className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        network?.id === n.id 
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                                        : "border-border/50 hover:border-primary/30"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                                        n.name === "MTN" ? "bg-yellow-100 text-yellow-700" :
                                        n.name === "GLO" ? "bg-green-100 text-green-700" :
                                        n.name === "AIRTEL" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                                    }`}>
                                        {n.name[0]}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">{n.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Selection */}
                    {network && categories && categories.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Data Category</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setCategory(""); setPlanId(""); setSelectedPlan(null); }}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                                        category === "" 
                                        ? "bg-primary text-primary-foreground border-primary" 
                                        : "bg-secondary text-muted-foreground border-transparent hover:border-primary/30"
                                    }`}
                                >
                                    All
                                </button>
                                {categories.map((c) => (
                                    <button
                                        key={String(c)}
                                        type="button"
                                        onClick={() => { setCategory(String(c)); setPlanId(""); setSelectedPlan(null); }}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                                            category === String(c) 
                                            ? "bg-primary text-primary-foreground border-primary" 
                                            : "bg-secondary text-muted-foreground border-transparent hover:border-primary/30"
                                        }`}
                                    >
                                        {String(c)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Phone Number */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                placeholder="080X XXX XXXX" 
                                className="h-14 rounded-2xl border-2 border-border/50 pl-12 focus-visible:ring-primary/20 bg-secondary/20 font-bold" 
                                type="tel" 
                                required 
                            />
                        </div>
                    </div>

                    {/* Plan Selection */}
                    {network && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Plan</label>
                            <DataPrices 
                                networkId={network.provider_id} 
                                category={category} 
                                selectedPlanId={planId}
                                onSelect={(plan) => {
                                    setPlanId(plan.plan_id);
                                    setSelectedPlan(plan);
                                }} 
                            />
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        variant="hero" 
                        className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" 
                        disabled={kvdata.isPending || !planId}
                    >
                        {kvdata.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </div>
                        ) : "Buy Data"}
                    </Button>
                </form>
            </div>

            <PinVerificationDialog
                open={pinOpen}
                onOpenChange={setPinOpen}
                onVerify={handleConfirmPurchase}
                isLoading={isVerifying || kvdata.isPending}
            />

            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="max-w-sm text-center">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold">Transaction Successful!</h2>
                    <p className="text-sm text-muted-foreground">Your data purchase was completed successfully.</p>
                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
                        <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Data;
