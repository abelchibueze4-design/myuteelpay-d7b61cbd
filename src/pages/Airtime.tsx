import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NetworkIcon } from "@/components/NetworkIcon";
import { Smartphone, Check, Loader2, Star, X, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKvdata } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { AirtimePrices } from "@/components/services/AirtimePrices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTransactionGuard } from "@/hooks/useTransactionGuard";
import { useFavorites } from "@/hooks/useFavorites";
import { PageTransition, ScaleTap } from "@/components/PageTransition";
import { ServicePageSkeleton } from "@/components/DashboardSkeleton";
import { TransactionResultScreen } from "@/components/TransactionResultScreen";
import { useSmartNetworkDefault } from "@/hooks/useSmartNetworkDefault";
import { PageBackButton } from "@/components/PageBackButton";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { applyMarkup } from "@/lib/applyMarkup";

const Airtime = () => {
    const navigate = useNavigate();
    const [network, setNetwork] = useState<{ network_id: number; network_name: string } | null>(null);
    const [phone, setPhone] = useState("");
    const [amount, setAmount] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [pinOpen, setPinOpen] = useState(false);
    const kvdata = useKvdata();
    const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();
    const { guardTransaction } = useTransactionGuard();
    const { favorites, addFavorite, removeFavorite, isFavorited } = useFavorites("airtime");
    const { settings } = usePlatformSettings();
    const markup = settings.airtime_markup || 0;

    const { data: networks, isLoading: networksLoading } = useQuery({
        queryKey: ["networks"],
        queryFn: async () => {
            const { data, error } = await supabase.from("networks").select("*");
            if (error) throw error;
            return data;
        }
    });

    const smartDefault = useSmartNetworkDefault(networks ?? undefined, "airtime");

    // Auto-select smart default on first load
    useEffect(() => {
        if (!network && smartDefault) {
            setNetwork(smartDefault);
        }
    }, [smartDefault]);

    if (networksLoading) return <ServicePageSkeleton />;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!network || !phone || !amount) return;
        const { allowed } = guardTransaction(Number(amount));
        if (!allowed) return;
        setPinOpen(true);
    };

    const handleConfirmPurchase = async (pin: string) => {
        const isValid = await verifyPin(pin);
        if (!isValid) return false;

        try {
            await kvdata.mutateAsync({
                action: "buy_airtime",
                network_id: network!.network_id,
                network_name: network!.network_name,
                phone,
                amount: Number(amount),
            });
            setShowSuccess(true);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <PageTransition className="min-h-screen bg-secondary pb-12">
            <div className="gradient-hero px-4 py-6 mb-6">
                <div className="container mx-auto flex items-center gap-3">
                    <PageBackButton />
                    <h1 className="text-lg font-bold text-primary-foreground">Buy Airtime</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-2xl">
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Network</label>
                        <div className="grid grid-cols-5 gap-2">
                            {networks?.map((n) => (
                                <button
                                    key={n.network_id}
                                    type="button"
                                    onClick={() => setNetwork(n)}
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

                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                placeholder="080X XXX XXXX" 
                                className="h-14 rounded-2xl border-2 border-border/50 pl-12 pr-20 focus-visible:ring-primary/20 bg-secondary/20 font-bold placeholder:text-[10px] placeholder:font-normal" 
                                type="tel" 
                                required 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const nav = navigator as any;
                                            if (nav.contacts?.select) {
                                                const contacts = await nav.contacts.select(['tel'], { multiple: false });
                                                if (contacts?.length && contacts[0].tel?.length) {
                                                    setPhone(contacts[0].tel[0].replace(/\D/g, ''));
                                                }
                                            } else {
                                                // Fallback: prompt user to type/paste number
                                                const input = document.createElement('input');
                                                input.type = 'tel';
                                                input.style.position = 'fixed';
                                                input.style.top = '-9999px';
                                                document.body.appendChild(input);
                                                input.focus();
                                                input.addEventListener('change', () => {
                                                    if (input.value) setPhone(input.value.replace(/\D/g, ''));
                                                    document.body.removeChild(input);
                                                });
                                                input.addEventListener('blur', () => {
                                                    setTimeout(() => { if (document.body.contains(input)) document.body.removeChild(input); }, 300);
                                                });
                                            }
                                        } catch (e) {
                                            console.warn('Contact picker error:', e);
                                        }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                                    title="Import from contacts"
                                >
                                    <Contact className="w-4 h-4 text-muted-foreground" />
                                </button>
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
                                        className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                                        title={isFavorited(phone) ? "Remove from favorites" : "Save to favorites"}
                                    >
                                        <Star className={`w-4 h-4 transition-colors ${isFavorited(phone) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Saved numbers */}
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

                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Quick Select Amount</label>
                        <AirtimePrices 
                            onSelect={(val) => setAmount(String(val))} 
                            selectedAmount={Number(amount)} 
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Amount</label>
                        <Input 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="₦100 - ₦50,000" 
                            className="h-14 rounded-2xl border-2 border-border/50 px-6 focus-visible:ring-primary/20 bg-secondary/20 text-xl font-black placeholder:text-[10px] placeholder:font-normal" 
                            type="number" 
                            required 
                        />
                    </div>

                    <Button 
                        type="submit" 
                        variant="hero" 
                        className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" 
                        disabled={kvdata.isPending || !amount || !network}
                    >
                        {kvdata.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </div>
                        ) : "Buy Airtime"}
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
                title="Airtime Sent!"
                description="Your airtime purchase was completed successfully."
                onNewPurchase={() => setShowSuccess(false)}
                onDone={() => navigate("/dashboard")}
            />
        </PageTransition>
    );
};

export default Airtime;
