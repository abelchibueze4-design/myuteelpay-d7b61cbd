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
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block"><img src={logo} alt="Uteelpay" className="h-12 w-auto mx-auto" /></Link>
          <h1 className="text-2xl font-bold mt-4">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in with your username</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="pl-10"
                type="text"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
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

          {/* Admin login link */}
          <Link
            to="/admin/login"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
          >
            <Shield className="w-4 h-4" />
            Login as Admin
          </Link>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;