import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NetworkIcon } from "@/components/NetworkIcon";
import { Smartphone, Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKvdata } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { DataPrices } from "@/components/services/DataPrices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTransactionGuard } from "@/hooks/useTransactionGuard";
import { useFavorites } from "@/hooks/useFavorites";
import { PageTransition } from "@/components/PageTransition";
import { ServicePageSkeleton } from "@/components/DashboardSkeleton";
import { TransactionResultScreen } from "@/components/TransactionResultScreen";
import { useSmartNetworkDefault } from "@/hooks/useSmartNetworkDefault";
import { PageBackButton } from "@/components/PageBackButton";

const Data = () => {
    const navigate = useNavigate();
    const [network, setNetwork] = useState<{ network_id: number; network_name: string } | null>(null);
    const [category, setCategory] = useState("");
    const [phone, setPhone] = useState("");
    const [planId, setPlanId] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [pinOpen, setPinOpen] = useState(false);
    
    const kvdata = useKvdata();
    const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();
    const { guardTransaction } = useTransactionGuard();
    const { favorites, addFavorite, removeFavorite, isFavorited } = useFavorites("data");

    const { data: networks, isLoading: networksLoading } = useQuery({
        queryKey: ["networks"],
        queryFn: async () => {
            const { data, error } = await supabase.from("networks").select("*");
            if (error) throw error;
            return data;
        }
    });

    const smartDefault = useSmartNetworkDefault(networks ?? undefined, "data");

    useEffect(() => {
        if (!network && smartDefault) {
            setNetwork(smartDefault);
        }
    }, [smartDefault]);

    // Get unique categories for the selected network
    const { data: categories } = useQuery({
        queryKey: ["data_plan_categories", network?.network_name],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("data_plans")
                .select("plan_type")
                .eq("network_name", network!.network_name);
            if (error) throw error;
            const types = new Set((data || []).map((p) => p.plan_type).filter(Boolean));
            return Array.from(types) as string[];
        },
        enabled: !!network
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!network || !phone || !planId) return;
        const { allowed } = guardTransaction(selectedPlan?.price || 0);
        if (!allowed) return;
        setPinOpen(true);
    };

    const handleConfirmPurchase = async (pin: string) => {
        const isValid = await verifyPin(pin);
        if (!isValid) return false;
        if (!selectedPlan) return false;

        try {
            await kvdata.mutateAsync({
                action: "buy_data",
                network_id: network!.network_id,
                network_name: network!.network_name,
                phone,
                plan_id: selectedPlan.plan_id,
                plan_label: selectedPlan.label,
                amount: selectedPlan.price,
            });
            setShowSuccess(true);
            return true;
        } catch {
            return false;
        }
    };

    if (networksLoading) return <ServicePageSkeleton />;

    return (
        <PageTransition className="min-h-screen bg-secondary pb-12">
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
                        <div className="grid grid-cols-4 gap-2">
                            {networks?.map((n) => (
                                <button
                                    key={n.network_id}
                                    type="button"
                                    onClick={() => { setNetwork(n); setCategory(""); setPlanId(""); setSelectedPlan(null); }}
                                    className={`py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                                        network?.network_id === n.network_id 
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                                        : "border-border/50 hover:border-primary/30"
                                    }`}
                                >
                                    <NetworkIcon networkName={n.network_name} />
                                    <span className="text-[10px] font-bold uppercase">{n.network_name}</span>
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
                                        key={c}
                                        type="button"
                                        onClick={() => { setCategory(c); setPlanId(""); setSelectedPlan(null); }}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                                            category === c 
                                            ? "bg-primary text-primary-foreground border-primary" 
                                            : "bg-secondary text-muted-foreground border-transparent hover:border-primary/30"
                                        }`}
                                    >
                                        {c}
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
                                className="h-14 rounded-2xl border-2 border-border/50 pl-12 pr-12 focus-visible:ring-primary/20 bg-secondary/20 font-bold" 
                                type="tel" 
                                required 
                            />
                            {phone.length >= 10 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isFavorited(phone)) {
                                            const fav = favorites.find(f => f.identifier === phone);
                                            if (fav) removeFavorite.mutate(fav.id);
                                        } else {
                                            addFavorite.mutate({ label: phone, identifier: phone, metadata: { network: network?.network_name } });
                                        }
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                                    title={isFavorited(phone) ? "Remove from favorites" : "Save to favorites"}
                                >
                                    <Star className={`w-4 h-4 transition-colors ${isFavorited(phone) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                                </button>
                            )}
                        </div>
                        {favorites.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                                {favorites.map((fav) => (
                                    <button
                                        key={fav.id}
                                        type="button"
                                        onClick={() => setPhone(fav.identifier)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                                            phone === fav.identifier 
                                                ? "border-primary bg-primary/5 text-primary" 
                                                : "border-border/50 text-muted-foreground hover:border-primary/30"
                                        }`}
                                    >
                                        <Star className="w-3 h-3 fill-accent text-accent" />
                                        {fav.identifier}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Plan Selection */}
                    {network && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Plan</label>
                            <DataPrices 
                                networkName={network.network_name} 
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

            <TransactionResultScreen
                open={showSuccess}
                onOpenChange={setShowSuccess}
                success={true}
                title="Data Purchased!"
                description="Your data bundle was activated successfully."
                onNewPurchase={() => setShowSuccess(false)}
                onDone={() => navigate("/dashboard")}
            />
        </PageTransition>
    );
};

export default Data;
