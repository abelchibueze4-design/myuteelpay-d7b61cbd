import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, user: authUser } = await adminSignIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const role = authUser?.user_metadata?.role;
    const isAdmin = !!role || authUser?.email?.endsWith("@uteelpay.com") || authUser?.email === "Josephine@gmail.com";

    if (!isAdmin) {
      toast.error("You do not have admin access");
      return;
    }

    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient">Uteelpay Admin</Link>
          <h1 className="text-2xl font-bold mt-4">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your admin credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="pl-10"
                type="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10"
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" variant="hero" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"} <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Back to <Link to="/login" className="text-primary font-semibold hover:underline">User Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;