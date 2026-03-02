import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const DangerZone = () => {
  const { user, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteVerification, setDeleteVerification] = useState("");
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setError(null);

    // Validate verification
    if (deleteVerification !== "DELETE MY ACCOUNT") {
      setError("Verification text does not match");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setIsDeleting(true);

    try {
      // Call a backend function to delete user
      const { error: rpcError } = await (supabase.rpc as any)("delete_user_account", {
        auth_uid: user.id,
      });

      if (rpcError) {
        // Fallback: Delete from profiles (cascade will handle related data)
        const { error: deleteError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id);

        if (deleteError) throw deleteError;
      }

      toast.success("Account deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteVerification("");
      setPassword("");

      // Sign out and redirect
      await signOut();
      window.location.href = "/";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete account";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setIsDeleting(true);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Account deactivated. You will be logged out.");
      await signOut();
      window.location.href = "/";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to deactivate account";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-lg">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Irreversible actions - proceed with caution
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-destructive/20">
        {/* Deactivate Account */}
        <div className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <div>
            <p className="font-medium text-sm text-foreground">Deactivate Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Temporarily hide your account. You can reactivate anytime.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeactivateAccount}
            disabled={isDeleting}
            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
          >
            Deactivate
          </Button>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <div>
            <p className="font-medium text-sm text-foreground">Delete Account Permanently</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                This action is <strong>permanent and irreversible</strong>. All your data will be deleted:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>Personal information</li>
                <li>Transaction history</li>
                <li>Wallet data</li>
                <li>All account settings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4 border-t border-border">
            <div>
              <Label htmlFor="verify-text" className="text-sm font-medium">
                Type <code className="bg-muted px-1 py-0.5 rounded text-xs">DELETE MY ACCOUNT</code> to confirm
              </Label>
              <Input
                id="verify-text"
                placeholder="Type to confirm"
                value={deleteVerification}
                onChange={(e) => setDeleteVerification(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Enter your password to confirm
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={
                isDeleting ||
                deleteVerification !== "DELETE MY ACCOUNT" ||
                !password
              }
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
