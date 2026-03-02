import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset link sent to your email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient">Uteelpay</Link>
          <h1 className="text-2xl font-bold mt-4">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
        </div>
        {sent ? (
          <div className="bg-card rounded-2xl p-8 shadow-card text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Check Your Email</h2>
            <p className="text-sm text-muted-foreground">We sent a password reset link to <span className="font-semibold text-foreground">{email}</span></p>
            <Link to="/login"><Button variant="outline" className="w-full"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Login</Button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" type="email" required />
              </div>
            </div>
            <Button type="submit" className="w-full" variant="hero" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"} <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
