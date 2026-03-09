import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, Lock, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(username, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-secondary px-4 py-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-5">
          <Link to="/" className="inline-block"><img src={logo} alt="Uteelpay" className="h-16 w-auto mx-auto" /></Link>
          <h1 className="text-xl font-bold mt-2">Login</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 shadow-card space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="h-10 pl-9 text-sm placeholder:text-[10px]"
                type="text"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 pl-9 pr-9 text-sm placeholder:text-[10px]"
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-10 text-sm" variant="hero" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"} <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <Link
            to="/admin/login"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition"
          >
            <Shield className="w-3.5 h-3.5" />
            Login as Admin
          </Link>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
