import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  User, Shield, Bell, HeadphonesIcon, ChevronRight, ArrowLeft, LogOut, Palette,
} from "lucide-react";
import { useTheme } from "next-themes";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { SecuritySettings } from "@/components/SecuritySettings";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { SupportSection } from "@/components/SupportSection";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect } from "react";

const menuItems = [
  { key: "profile", label: "Edit Profile", description: "Update your personal information", icon: User },
  { key: "security", label: "Security", description: "Password & transaction PIN", icon: Shield },
  { key: "notifications", label: "Notifications", description: "Manage alert preferences", icon: Bell },
  { key: "support", label: "Help & Support", description: "Get help from our team", icon: HeadphonesIcon },
];

const SettingsPage = () => {
  const [, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  const handleBack = () => {
    if (activeSection) {
      setActiveSection(null);
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] min-h-screen flex flex-col font-sans">
      <DashboardTopBar />

      {/* Header */}
      <div className="relative overflow-hidden bg-primary px-4 pt-10 pb-20 sm:pt-12 lg:px-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {activeSection ? menuItems.find(m => m.key === activeSection)?.label : "Settings"}
              </h1>
              <p className="text-white/60 text-xs mt-0.5 font-medium">
                {activeSection ? menuItems.find(m => m.key === activeSection)?.description : "Manage your account"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20 pb-24">
        {!activeSection ? (
          /* Menu List */
          <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-xl shadow-primary/5">
            {/* User avatar header */}
            <div className="p-6 border-b border-border/30 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl font-black shadow-lg">
                {(user?.user_metadata?.full_name?.[0] || "U").toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground text-base">{user?.user_metadata?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="divide-y divide-border/30">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-accent/5 transition-all group text-left"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm tracking-tight">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-border/30">
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-destructive/5 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-destructive text-sm tracking-tight">Log Out</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Section Content */
          <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-xl shadow-primary/5 p-6">
            {activeSection === "profile" && <ProfileForm />}
            {activeSection === "security" && <SecuritySettings />}
            {activeSection === "notifications" && <NotificationPreferences />}
            {activeSection === "support" && <SupportSection />}
          </div>
        )}
      </div>
    </div>
  );
};

/* Profile Edit Form (extracted inline) */
const ProfileForm = () => {
  const { user } = useAuth();
  const { updateProfile, isLoading, error: hookError } = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPhone(user.user_metadata?.phone_number || "");
      setAddress(user.user_metadata?.address || "");
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^[0-9]{10,}$/.test(phone.replace(/\D/g, ""))) newErrors.phone = "Phone number must be at least 10 digits";
    if (!address.trim()) newErrors.address = "Address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const success = await updateProfile({
      full_name: fullName,
      phone_number: phone,
      address: address,
    });
    if (success) toast.success("Profile updated successfully");
    else toast.error(hookError || "Failed to update profile");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col items-center pb-4 border-b border-border/30">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold">
          {fullName[0]?.toUpperCase() || "U"}
        </div>
        <p className="text-sm font-bold text-foreground mt-3">{fullName || "User"}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>

      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" value={fullName} onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: "" }); }} className={errors.fullName ? "border-destructive" : ""} placeholder="Enter your full name" />
        {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" value={email} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground mt-1">Contact support to update email.</p>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" value={phone} onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: "" }); }} className={errors.phone ? "border-destructive" : ""} placeholder="e.g., 07036006762" />
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={address} onChange={(e) => { setAddress(e.target.value); if (errors.address) setErrors({ ...errors, address: "" }); }} className={errors.address ? "border-destructive" : ""} placeholder="Your address" />
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full rounded-2xl h-12 font-bold">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};

export default SettingsPage;
