"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { upsertSedoCredentials } from "@/lib/supabase/queries/settings-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SedoCredentialsForm() {
  const [partnerId, setPartnerId] = useState("");
  const [signKey, setSignKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase.from("user_settings").select("*").single();

      if (data) {
        const settings = data as Record<string, unknown>;
        if (settings.sedo_partner_id) setPartnerId(String(settings.sedo_partner_id));
        if (settings.sedo_signkey) setSignKey(String(settings.sedo_signkey));
        if (settings.sedo_username) setUsername(String(settings.sedo_username));
        if (settings.sedo_password) setPassword(String(settings.sedo_password));
      }

      setLoaded(true);
    }

    loadSettings();
  }, []);

  async function handleTestConnection() {
    setConnectionStatus("testing");
    try {
      const response = await fetch("/api/sedo/check");
      const body = await response.json();

      if (body.data?.connected) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("invalid");
      }
    } catch {
      setConnectionStatus("invalid");
    }
  }

  async function handleSave() {
    if (!partnerId || !signKey || !username || !password) {
      toast.error("All four fields are required");
      return;
    }

    setSaving(true);
    try {
      await upsertSedoCredentials({
        sedo_partner_id: Number(partnerId),
        sedo_signkey: signKey,
        sedo_username: username,
        sedo_password: password,
      });

      toast.success("Sedo credentials saved");
      setConnectionStatus("idle");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sedo API Credentials</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sedo API Credentials</CardTitle>
        <CardDescription>
          Connect your Sedo account to manage listings directly from DomainVault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="sedo-partner-id">Partner ID</Label>
          <Input
            id="sedo-partner-id"
            type="number"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            placeholder="Enter your Sedo Partner ID"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="sedo-sign-key">Sign Key</Label>
          <Input
            id="sedo-sign-key"
            type="text"
            value={signKey}
            onChange={(e) => setSignKey(e.target.value)}
            placeholder="Enter your Sign Key"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="sedo-username">Username</Label>
          <Input
            id="sedo-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your Sedo username"
            maxLength={25}
            className="mt-1"
          />
          <p className="text-xs text-text-muted mt-1">Max 25 characters</p>
        </div>

        <div>
          <Label htmlFor="sedo-password">Password</Label>
          <div className="relative mt-1">
            <Input
              id="sedo-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={password ? "••••••••" : "Your Sedo password"}
              maxLength={16}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">Max 16 characters</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={connectionStatus === "testing" || !partnerId || !signKey || !username || !password}
            >
              {connectionStatus === "testing" ? "Testing..." : "Test Connection"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Credentials"}
            </Button>
          </div>

          {connectionStatus === "connected" && (
            <div className="flex items-center gap-2 text-accent-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
          {connectionStatus === "invalid" && (
            <div className="flex items-center gap-2 text-accent-danger">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Invalid credentials</span>
            </div>
          )}
        </div>

        <p className="text-xs text-text-muted pt-2">
          Partner ID and Sign Key are provided by Sedo upon request.
          Register at{" "}
          <a
            href="https://sedo.com/services/sedos-partner-program/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary underline"
          >
            sedo.com/services/sedos-partner-program
          </a>{" "}
          then email support@sedo.com.
        </p>
      </CardContent>
    </Card>
  );
}
