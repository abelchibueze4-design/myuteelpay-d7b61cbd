import { useState, useRef, useEffect } from "react";
import { Settings, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { toast } from "sonner";

interface AccountSettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AccountSettings = ({ open, onOpenChange }: AccountSettingsProps) => {
  const { user } = useAuth();
  const { updateProfile, uploadAvatar, isLoading, error: hookError } = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(open ?? false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPhone(user.user_metadata?.phone_number || "");
      setAddress(user.user_metadata?.address || "");
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      if (user.user_metadata?.avatar_url) {
        setAvatarPreview(user.user_metadata.avatar_url);
      }
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

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    const url = await uploadAvatar(file);
    setIsUploading(false);

    if (url) {
      setAvatarUrl(url);
      toast.success("Avatar uploaded successfully");
    } else {
      toast.error(hookError || "Failed to upload avatar");
    }
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
      avatar_url: avatarUrl || undefined,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  fullName[0]?.toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground text-center">
              {isUploading ? "Uploading..." : "Click camera to upload profile picture"}
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
              disabled={isLoading || isUploading}
              className="flex-1"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
