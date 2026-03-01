import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will integrate with Supabase auth
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient">PayNaija</Link>
          <h1 className="text-2xl font-bold mt-4">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" type="email" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" type="password" required />
            </div>
          </div>
          <Button type="submit" className="w-full" variant="hero">
            Sign In <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
