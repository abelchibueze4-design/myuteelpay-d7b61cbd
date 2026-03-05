import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata } from "@/hooks/useKvdata";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { AirtimePrices } from "@/components/services/AirtimePrices";

const networks = ["MTN", "Glo", "Airtel", "9mobile"];

const Airtime = () => {
    const navigate = useNavigate();
    const [network, setNetwork] = useState("");
    const [phone, setPhone] = useState("");
    const [amount, setAmount] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [pinOpen, setPinOpen] = useState(false);
    const kvdata = useKvdata();
    const { verifyPin, isLoading: isVerifying } = useTransactionPinVerification();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!network || !phone || !amount) return;
        setPinOpen(true);
    };

    const handleConfirmPurchase = async (pin: string) => {
        const isValid = await verifyPin(pin);
        if (!isValid) return false;

        try {
            await kvdata.mutateAsync({
                action: "buy_airtime",
                network,
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
        <div className="min-h-screen bg-secondary pb-12">
            <div className="gradient-hero px-4 py-6 mb-6">
                <div className="container mx-auto">
                    <h1 className="text-lg font-bold text-primary-foreground">Buy Airtime</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-2xl">
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Network</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {networks.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setNetwork(n)}
                                    className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        network === n 
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                                        : "border-border/50 hover:border-primary/30"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                                        n === "MTN" ? "bg-yellow-100 text-yellow-700" :
                                        n === "Glo" ? "bg-green-100 text-green-700" :
                                        n === "Airtel" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                                    }`}>
                                        {n[0]}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">{n}</span>
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
                                className="h-14 rounded-2xl border-2 border-border/50 pl-12 focus-visible:ring-primary/20 bg-secondary/20 font-bold" 
                                type="tel" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Quick Select Amount</label>
                        <AirtimePrices 
                            onSelect={(val) => setAmount(String(val))} 
                            selectedAmount={Number(amount)} 
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Custom Amount</label>
                        <Input 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="₦100 - ₦50,000" 
                            className="h-14 rounded-2xl border-2 border-border/50 px-6 focus-visible:ring-primary/20 bg-secondary/20 text-xl font-black" 
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

            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="max-w-sm text-center">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold">Transaction Successful!</h2>
                    <p className="text-sm text-muted-foreground">Your airtime purchase was completed successfully.</p>
                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowSuccess(false)}>New Purchase</Button>
                        <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>Done</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Airtime;
