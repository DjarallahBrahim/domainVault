"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, User, Sun, Moon, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
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

  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => setThemeMounted(true), []);

  const themeValue = themeMounted
    ? ((theme as "light" | "dark" | "system") ?? "system")
    : null;

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
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="text-large-title text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your account, security and marketplace connections.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-section text-text-primary">Account</h2>
          <p className="mt-1 text-sm text-text-muted">Your profile details and password.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10">
                  <User className="h-5 w-5 text-accent-primary" />
                </div>
                <div>
                  <CardTitle className="text-card-title">Profile</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  Email
                </p>
                <p className="mt-1 font-medium">{user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  Member since
                </p>
                <p className="mt-1 font-medium">{memberSince}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-card-title">Change password</CardTitle>
              <CardDescription>At least 8 characters including 1 number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters, 1 number"
                  className="mt-1.5"
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
                  className="mt-1.5"
                />
              </div>
              {passwordError && <p className="text-sm text-accent-danger">{passwordError}</p>}
              <Button
                onClick={handleSavePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
              >
                {savingPassword ? "Saving..." : "Save password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-section text-text-primary">Appearance</h2>
          <p className="mt-1 text-sm text-text-muted">
            Choose how DNfly.io looks on this device.
          </p>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-card-title">Theme</CardTitle>
            <CardDescription>Light, dark, or match your system</CardDescription>
          </CardHeader>
          <CardContent>
            <Segmented
              size="sm"
              aria-label="Theme"
              options={[
                {
                  value: "light",
                  label: (
                    <span className="flex items-center gap-1.5">
                      <Sun className="h-3.5 w-3.5" />
                      Light
                    </span>
                  ),
                },
                {
                  value: "dark",
                  label: (
                    <span className="flex items-center gap-1.5">
                      <Moon className="h-3.5 w-3.5" />
                      Dark
                    </span>
                  ),
                },
                {
                  value: "system",
                  label: (
                    <span className="flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5" />
                      System
                    </span>
                  ),
                },
              ]}
              value={themeValue}
              onChange={setTheme}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-section text-text-primary">Marketplace integrations</h2>
          <p className="mt-1 text-sm text-text-muted">
            Connect marketplaces to publish and sync your listings automatically.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <SedoCredentialsForm />
          <SpaceshipCredentialsForm />
        </div>
      </section>

      <section>
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="font-medium">Sign out</p>
              <p className="text-sm text-text-muted">
                Sign out of your DNfly.io account on this device.
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
