import { useState, useRef, useEffect } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecuritySettings } from "@/components/SecuritySettings";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { DangerZone } from "@/components/DangerZone";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { toast } from "sonner";

interface AccountSettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AccountSettings = ({ open, onOpenChange }: AccountSettingsProps) => {
  const { user } = useAuth();
  const { updateProfile, isLoading, error: hookError } = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(open ?? false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPhone(user.user_metadata?.phone_number || "");
      setAddress(user.user_metadata?.address || "");
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10,}$/.test(phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await updateProfile({
      full_name: fullName,
      phone_number: phone,
      address: address,
    });

    if (success) {
      toast.success("Profile updated successfully");
      handleClose();
    } else {
      toast.error(hookError || "Failed to update profile");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Account Settings">
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-0">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
            <TabsTrigger value="danger" className="text-xs sm:text-sm text-destructive">Danger</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Display */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold">
                  {fullName[0]?.toUpperCase() || "U"}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {fullName || "User"}
                </p>
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: "" });
                    }
                  }}
                  className={errors.fullName ? "border-destructive" : ""}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted"
                  placeholder="Your email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed here. Contact support to update.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) {
                      setErrors({ ...errors, phone: "" });
                    }
                  }}
                  className={errors.phone ? "border-destructive" : ""}
                  placeholder="e.g., 07036006762"
                />
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) {
                      setErrors({ ...errors, address: "" });
                    }
                  }}
                  className={errors.address ? "border-destructive" : ""}
                  placeholder="Your address"
                />
                {errors.address && (
                  <p className="text-xs text-destructive mt-1">{errors.address}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <SecuritySettings />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <NotificationPreferences />
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="mt-6">
            <DangerZone />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
