import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Check, CreditCard, Download, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const networks = ["MTN", "Glo", "Airtel", "9mobile"];
const cardPlans = [
    { label: "MTN 1GB Data Card", plan_id: 101, network: "MTN", price: 350 },
    { label: "MTN 2GB Data Card", plan_id: 102, network: "MTN", price: 700 },
    { label: "Airtel 1GB Data Card", plan_id: 201, network: "Airtel", price: 400 },
    { label: "Glo 2GB Data Card", plan_id: 301, network: "Glo", price: 600 },
];

const DataCard = () => {
    const navigate = useNavigate();
    const [network, setNetwork] = useState("");
    const [plan, setPlan] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [showSuccess, setShowSuccess] = useState(false);
    const [pinOpen, setPinOpen] = useState(false);
    const kvdata = useKvdata();
    const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();

    const filteredPlans = network ? cardPlans.filter(p => p.network === network) : cardPlans;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!network || !plan) return;
        setPinOpen(true);
    };

    const handleConfirmPurchase = async (pin: string) => {
        const isValid = await verifyPin(pin);
        if (!isValid) return false;

        const selectedPlan = cardPlans.find((p) => String(p.plan_id) === plan);
        if (!selectedPlan) return false;

        try {
            await kvdata.mutateAsync({
                action: "buy_data_card",
                network,
                plan_id: selectedPlan.plan_id,
                plan_label: selectedPlan.label,
                quantity: parseInt(quantity),
                amount: selectedPlan.price * parseInt(quantity),
            });
            setShowSuccess(true);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-24">
            {/* Header */}
            <div className="bg-primary px-4 py-12 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="container mx-auto relative z-10 flex flex-col items-center text-center max-w-2xl">
                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-xl border border-white/10">
                        <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Data PIN Generator</h1>
                    <p className="text-white/70 text-sm font-medium">Generate printable data cards for any network instantly.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-xl">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 border border-border/50 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Network</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {networks.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setNetwork(n)}
                                    className={cn(
                                        "py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                        network === n
                                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                            : "border-border/50 hover:border-primary/30"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                                        n === "MTN" ? "bg-yellow-100 text-yellow-700" :
                                            n === "Glo" ? "bg-green-100 text-green-700" :
                                                n === "Airtel" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                                    )}>
                                        {n[0]}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">{n}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Choose Data Plan</label>
                        <Select value={plan} onValueChange={setPlan}>
                            <SelectTrigger className="h-16 rounded-2xl border-2 border-border/50 focus:ring-primary/20 bg-secondary/20">
                                <SelectValue placeholder="Browse available plans" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                {filteredPlans.map((p) => (
                                    <SelectItem key={p.plan_id} value={String(p.plan_id)} className="py-3 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{p.label}</span>
                                            <span className="text-[10px] text-primary font-black uppercase">₦{p.price.toLocaleString()}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Total Quantity</label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="1"
                                max="50"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="h-16 rounded-2xl border-2 border-border/50 text-2xl font-black pl-6 focus-visible:ring-primary/20 bg-secondary/20"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full">
                                MAX 50
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-black text-lg gap-2" disabled={kvdata.isPending || !network || !plan}>
                            {kvdata.isPending ? "Generating..." : "Generate Pins"}
                        </Button>
                    </div>
                </form>
            </div>

            <PinVerificationDialog
                open={pinOpen}
                onOpenChange={setPinOpen}
                onVerify={handleConfirmPurchase}
                isLoading={isVerifying || kvdata.isPending}
            />

            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="max-w-md p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
                    <div className="bg-emerald-500 p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Check className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-2">Generation Success!</h2>
                        <p className="text-white/80 text-xs font-medium">Your data PIN cards are ready for download or printing.</p>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-bold gap-2">
                                <Download className="w-4 h-4" /> Download PDF Receipt
                            </Button>
                            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-border/50 hover:bg-secondary font-bold gap-2">
                                <Printer className="w-4 h-4" /> Print Data Cards
                            </Button>
                            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-border/50 hover:bg-secondary font-bold gap-2">
                                <Share2 className="w-4 h-4" /> Bulk Share (CSV)
                            </Button>
                        </div>
                        <Button className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg mt-4 shadow-xl shadow-slate-200" onClick={() => navigate("/dashboard")}>
                            Back to Dashboard
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DataCard;
