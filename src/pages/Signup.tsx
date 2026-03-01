import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Phone, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", referralCode: "" });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name, form.phone, form.referralCode);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    }
  };

  const fields = [
    { key: "name", label: "Full Name", icon: User, type: "text", placeholder: "John Doe" },
    { key: "email", label: "Email", icon: Mail, type: "email", placeholder: "you@example.com" },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel", placeholder: "+234 800 000 0000" },
    { key: "password", label: "Password", icon: Lock, type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient">PayNaija</Link>
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
                  required
                />
              </div>
            </div>
          ))}
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
