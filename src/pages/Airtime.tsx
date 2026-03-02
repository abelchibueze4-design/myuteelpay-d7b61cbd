import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useKvdata } from "@/hooks/useKvdata";

const networks = ["MTN", "Glo", "Airtel", "9mobile"];

const Airtime = () => {
    const navigate = useNavigate();
    const [network, setNetwork] = useState("");
    const [phone, setPhone] = useState("");
    const [amount, setAmount] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const kvdata = useKvdata();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!network || !phone || !amount) return;

        try {
            await kvdata.mutateAsync({
                action: "buy_airtime",
                network,
                phone,
                amount: Number(amount),
            });
            setShowSuccess(true);
        } catch {
            // error handled by hook
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
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Network</label>
                        <Select value={network} onValueChange={setNetwork}>
                            <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                            <SelectContent>{networks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080X XXX XXXX" className="pl-10" type="tel" required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount</label>
                        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦100 - ₦50,000" type="number" required />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={kvdata.isPending}>
                        {kvdata.isPending ? "Processing..." : "Buy Airtime"}
                    </Button>
                </form>
            </div>

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
