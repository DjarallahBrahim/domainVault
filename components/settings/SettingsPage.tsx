"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SedoCredentialsForm } from "@/components/settings/SedoCredentialsForm";
import { SpaceshipCredentialsForm } from "@/components/settings/SpaceshipCredentialsForm";

export function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    router.push("/login");
  }

  async function handleSavePassword() {
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError("Password must include at least 1 number");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Settings</h1>
        <p className="text-text-muted mt-1">Manage your account</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-text-muted" />
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-text-muted">Email</p>
            <p className="font-medium">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Member since</p>
            <p className="font-medium">{memberSince}</p>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <p className="font-medium mb-3">Change Password</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters, 1 number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-accent-danger">{passwordError}</p>
              )}
              <Button
                onClick={handleSavePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
              >
                {savingPassword ? "Saving..." : "Save Password"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SedoCredentialsForm />

      <SpaceshipCredentialsForm />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Logout</p>
              <p className="text-sm text-text-muted">Sign out of your account</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
