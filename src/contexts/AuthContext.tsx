import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, username: string, address: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  adminSignIn: (email: string, password: string) => Promise<{ error: Error | null; user?: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  checkPinRequired: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string, username: string, address: string, referralCode?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phone,
          username,
          address,
          referral_code: referralCode || undefined,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (identifier: string, password: string) => {
    let email: string;

    // Check if the identifier is an email
    const isEmail = identifier.includes("@");

    if (isEmail) {
      email = identifier;
    } else {
      // Look up email by username using the database function
      const { data: emailData, error: lookupError } = await supabase.rpc("get_email_by_username", {
        p_username: identifier
      });

      if (lookupError || !emailData) {
        return { error: new Error("User not found or invalid username.") };
      }
      email = emailData as string;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Check for specific error messages like unconfirmed email
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return { error: new Error("Account exists, but your email is not yet verified. Please check your inbox.") };
      }
      return { error: new Error("Invalid credentials. Please check your details and try again.") };
    }

    return { error: null };
  };

  // Separate admin login by email
  const adminSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null, user: data?.user ?? null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const checkPinRequired = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("transaction_pin_enabled" as any)
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return !(data as any)?.transaction_pin_enabled;
    } catch (err) {
      console.error("Error checking PIN requirement:", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, adminSignIn, signOut, resetPassword, checkPinRequired }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};