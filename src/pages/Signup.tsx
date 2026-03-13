import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Phone, User, ArrowRight, MapPin, AtSign, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { passwordRules, validatePassword, validateUsername } from "@/lib/passwordValidation";
import logo from "@/assets/logo.png";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", username: "", address: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Check username availability with debounce
  useEffect(() => {
    const username = form.username;
    if (!username || !validateUsername(username)) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.username]);

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
      // Show user-friendly messages instead of raw backend errors
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        toast.error("An account with this email already exists. Please sign in instead.");
      } else if (msg.includes("duplicate") || msg.includes("unique constraint") || msg.includes("username")) {
        toast.error("This username is already taken. Please choose a different one.");
      } else if (msg.includes("password")) {
        toast.error("Password does not meet the requirements. Please try again.");
      } else if (msg.includes("email")) {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } else {
      toast.success("Account created successfully!");
      navigate("/login");
    }
  };

  const fields = [
    { key: "name", label: "Full Name", icon: User, type: "text", placeholder: "John Doe", required: true, autoComplete: "name" },
    { key: "username", label: "Username", icon: AtSign, type: "text", placeholder: "johndoe", required: true, autoComplete: "username" },
    { key: "email", label: "Email", icon: Mail, type: "email", placeholder: "you@example.com", required: true, autoComplete: "email" },
    { key: "phone", label: "Phone", icon: Phone, type: "tel", placeholder: "+234 800 000 0000", required: true, autoComplete: "tel" },
    { key: "address", label: "Address", icon: MapPin, type: "text", placeholder: "Lagos, Nigeria", required: true, autoComplete: "street-address" },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center bg-secondary px-4 py-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-4">
          <Link to="/" className="inline-block"><img src={logo} alt="Uteelpay" className="h-14 w-auto mx-auto" /></Link>
          <h1 className="text-xl font-bold mt-2">Create Account</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Join thousands of Nigerians saving on bills</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 shadow-card space-y-2.5">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-medium">{f.label}</label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="h-9 pl-9 text-sm placeholder:text-[10px]"
                  type={f.type}
                  required={f.required}
                  autoComplete={f.autoComplete}
                />
              </div>
              {f.key === "username" && form.username && (
                <p className={`text-[10px] ${validateUsername(form.username) ? "text-green-600" : "text-destructive"}`}>
                  {validateUsername(form.username) ? "Username available format" : "3-20 chars, starts with letter, letters/numbers/_ only"}
                </p>
              )}
            </div>
          ))}

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                className="h-9 pl-9 pr-9 text-sm placeholder:text-[10px]"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {form.password && (
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                {passwordRules.map((rule, i) => {
                  const pass = rule.test(form.password);
                  return (
                    <div key={i} className={`flex items-center gap-1 text-[10px] ${pass ? "text-green-600" : "text-muted-foreground"}`}>
                      {pass ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Referral code */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Referral Code <span className="text-muted-foreground">(Optional)</span></label>
            <Input
              value={form.referralCode}
              onChange={(e) => update("referralCode", e.target.value)}
              placeholder="Enter referral code"
              className="h-9 text-sm placeholder:text-[10px]"
            />
          </div>

          <Button type="submit" className="w-full h-10 text-sm mt-1" variant="hero" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
