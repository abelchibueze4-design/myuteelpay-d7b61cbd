import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Phone, User, ArrowRight, MapPin, AtSign, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { passwordRules, validatePassword, validateUsername } from "@/lib/passwordValidation";
import { lovable } from "@/integrations/lovable/index";

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

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error(error.message);
            }}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign up with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error(error.message);
            }}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Sign up with Apple
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
