import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Phone, User, ArrowRight, MapPin, AtSign, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { passwordRules, validatePassword, validateUsername } from "@/lib/passwordValidation";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", username: "", address: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(form.password)) {
      toast.error("Password does not meet requirements");
      return;
    }
    if (!validateUsername(form.username)) {
      toast.error("Username must be 3-20 characters, start with a letter, and contain only letters, numbers, or underscores");
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name, form.phone, form.username, form.address, form.referralCode);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    }
  };

  const fields = [
    { key: "name", label: "Full Name", icon: User, type: "text", placeholder: "John Doe", required: true },
    { key: "username", label: "Username", icon: AtSign, type: "text", placeholder: "johndoe", required: true },
    { key: "email", label: "Email", icon: Mail, type: "email", placeholder: "you@example.com", required: true },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel", placeholder: "+234 800 000 0000", required: true },
    { key: "address", label: "Address", icon: MapPin, type: "text", placeholder: "Lagos, Nigeria", required: true },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient">Uteelpay</Link>
          <h1 className="text-2xl font-bold mt-4">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join thousands of Nigerians saving on bills</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <label className="text-sm font-medium">{f.label}</label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="pl-10"
                  type={f.type}
                  required={f.required}
                />
              </div>
              {f.key === "username" && form.username && (
                <p className={`text-xs ${validateUsername(form.username) ? "text-green-600" : "text-destructive"}`}>
                  {validateUsername(form.username) ? "Username available format" : "3-20 chars, starts with letter, letters/numbers/_ only"}
                </p>
              )}
            </div>
          ))}

          {/* Password with visibility toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10"
                type={showPassword ? "text" : "password"}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.password && (
              <div className="space-y-1 mt-2">
                {passwordRules.map((rule, i) => {
                  const pass = rule.test(form.password);
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

          {/* Referral code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Code (Optional)</label>
            <Input
              value={form.referralCode}
              onChange={(e) => update("referralCode", e.target.value)}
              placeholder="Enter referral code"
            />
          </div>

          <Button type="submit" className="w-full" variant="hero" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
