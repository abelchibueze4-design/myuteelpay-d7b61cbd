import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Gift, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const referrals = [
  { name: "Adebayo O.", date: "Feb 28, 2026", earnings: "₦200" },
  { name: "Chioma E.", date: "Feb 25, 2026", earnings: "₦200" },
  { name: "Emeka N.", date: "Feb 20, 2026", earnings: "₦200" },
];

const Referral = () => {
  const navigate = useNavigate();
  const refLink = "https://paynaija.com/ref/chinedu123";

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    toast.success("Referral link copied!");
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="gradient-hero px-4 py-6">
        <div className="container mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Refer & Earn</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 -mt-2">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-5 shadow-card text-center">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-extrabold">3</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-card text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-extrabold text-gradient">₦600</p>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
          <h2 className="font-bold mb-1">Your Referral Link</h2>
          <p className="text-xs text-muted-foreground mb-3">Share and earn ₦200 for each signup</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm font-mono truncate">
              {refLink}
            </div>
            <Button variant="gold" size="icon" onClick={copyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Referred Users */}
        <h2 className="font-bold text-lg mb-3">Referred Users</h2>
        <div className="bg-card rounded-2xl shadow-card divide-y mb-8">
          {referrals.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-accent">{r.earnings}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Referral;
