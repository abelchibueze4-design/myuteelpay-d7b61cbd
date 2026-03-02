import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { passwordRules, validatePassword } from "@/lib/passwordValidation";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a recovery session
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      toast.error("Password does not meet requirements");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid or expired reset link.</p>
          <Link to="/forgot-password"><Button variant="hero">Request New Link</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient">Uteelpay</Link>
          <h1 className="text-2xl font-bold mt-4">Set New Password</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" type={showPassword ? "text" : "password"} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <div className="space-y-1 mt-2">
                {passwordRules.map((rule, i) => {
                  const pass = rule.test(password);
                  return (
                    <div key={i} className={`flex items-center gap-2 text-xs ${pass ? "text-green-600" : "text-muted-foreground"}`}>
                      {pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="pl-10" type="password" required />
            </div>
          </div>
          <Button type="submit" className="w-full" variant="hero" disabled={loading}>
            {loading ? "Updating..." : "Update Password"} <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
