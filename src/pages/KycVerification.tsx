import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useKycStatus, useSubmitKyc } from "@/hooks/useKyc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck, Clock, XCircle, CheckCircle2, ArrowLeft, AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const KycVerification = () => {
  const { user } = useAuth();
  const { data: kyc, isLoading } = useKycStatus();
  const submitKyc = useSubmitKyc();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState("nin");
  const [idNumber, setIdNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dob || !address || !idNumber) return;
    submitKyc.mutate({
      full_name: fullName,
      date_of_birth: dob,
      address,
      id_type: idType,
      id_number: idNumber,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Under Review" },
    approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Verified" },
    rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Rejected" },
  };

  // Already submitted
  if (kyc) {
    const cfg = statusConfig[kyc.status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className={cn("fintech-card p-6 text-center border-2", cfg.bg)}>
            <Icon className={cn("w-16 h-16 mx-auto mb-4", cfg.color)} />
            <h2 className="text-xl font-bold text-foreground mb-1">KYC {cfg.label}</h2>
            <Badge variant="outline" className={cn("mb-4", cfg.color)}>{kyc.status.toUpperCase()}</Badge>

            {kyc.status === "approved" && (
              <p className="text-sm text-muted-foreground">
                Your identity is verified! You now enjoy unlimited balance and higher transaction limits.
              </p>
            )}
            {kyc.status === "pending" && (
              <p className="text-sm text-muted-foreground">
                Your submission is being reviewed. This usually takes 1–24 hours.
              </p>
            )}
            {kyc.status === "rejected" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {kyc.admin_notes || "Your submission was rejected. Please resubmit with correct details."}
                </p>
                <Button
                  onClick={() => {
                    // Allow re-submission by clearing local state
                    setFullName(kyc.full_name);
                    setDob(kyc.date_of_birth);
                    setAddress(kyc.address);
                    setIdType(kyc.id_type);
                    setIdNumber(kyc.id_number);
                    // We'll trigger a re-render by updating status locally — the upsert handles the rest
                    submitKyc.mutate({
                      full_name: kyc.full_name,
                      date_of_birth: kyc.date_of_birth,
                      address: kyc.address,
                      id_type: kyc.id_type,
                      id_number: kyc.id_number,
                    });
                  }}
                  className="btn-gold"
                >
                  Resubmit KYC
                </Button>
              </div>
            )}
          </div>

          <div className="fintech-card p-4 space-y-2">
            <h3 className="text-sm font-bold text-foreground">Submission Details</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{kyc.full_name}</span></div>
              <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{kyc.date_of_birth}</span></div>
              <div><span className="text-muted-foreground">ID Type:</span> <span className="font-medium uppercase">{kyc.id_type}</span></div>
              <div><span className="text-muted-foreground">ID Number:</span> <span className="font-medium">{kyc.id_number}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{kyc.address}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // KYC form
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Verify Your Identity</h1>
          <p className="text-sm text-muted-foreground">Complete KYC to unlock premium features</p>
        </div>

        {/* Benefits */}
        <div className="fintech-card p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Without KYC, your balance limit is ₦10,000
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Unlimited wallet balance</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Higher single transaction limits</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Priority customer support</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified badge on profile</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="fintech-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Full Legal Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As it appears on your ID" required className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Date of Birth</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Residential Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your full residential address" required className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">ID Type</Label>
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nin">National ID (NIN)</SelectItem>
                <SelectItem value="bvn">Bank Verification Number (BVN)</SelectItem>
                <SelectItem value="voters_card">Voter's Card</SelectItem>
                <SelectItem value="drivers_license">Driver's License</SelectItem>
                <SelectItem value="passport">International Passport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">ID Number</Label>
            <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter your ID number" required className="h-11 rounded-xl" />
          </div>

          <Button type="submit" className="w-full h-12 rounded-2xl btn-gold font-bold" disabled={submitKyc.isPending}>
            {submitKyc.isPending ? "Submitting..." : "Submit for Verification"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default KycVerification;
