"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertSedoCredentials,
  fetchSedoPassword,
} from "@/lib/supabase/queries/settings-client";
import { SecretField } from "@/components/settings/secret-field";
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
  const [hasStoredPassword, setHasStoredPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      // Never preload the password — it is fetched only when the user
      // explicitly reveals it.
      const { data } = await supabase
        .from("user_settings")
        .select("sedo_partner_id, sedo_signkey, sedo_username")
        .maybeSingle();

      if (data) {
        const settings = data as Record<string, unknown>;
        if (settings.sedo_partner_id) setPartnerId(String(settings.sedo_partner_id));
        if (settings.sedo_signkey) setSignKey(String(settings.sedo_signkey));
        if (settings.sedo_username) setUsername(String(settings.sedo_username));
        setHasStoredPassword(Boolean(settings.sedo_username));
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
    if (!partnerId || !signKey || !username) {
      toast.error("Partner ID, Sign Key and Username are required");
      return;
    }
    if (!hasStoredPassword && !password) {
      toast.error("Password is required");
      return;
    }

    setSaving(true);
    try {
      await upsertSedoCredentials({
        sedo_partner_id: Number(partnerId),
        sedo_signkey: signKey,
        sedo_username: username,
        sedo_password: password || undefined,
      });

      toast.success("Sedo credentials saved");
      setConnectionStatus("idle");
      setHasStoredPassword(true);
      setPassword("");
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
          Connect your Sedo account to manage listings directly from DNfly.io
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

        <SecretField
          id="sedo-password"
          label="Password"
          value={password}
          onChange={setPassword}
          hasStoredSecret={hasStoredPassword}
          fetchStoredSecret={fetchSedoPassword}
          placeholder={hasStoredPassword ? "••••••••  (saved)" : "Your Sedo password"}
          maxLength={16}
          helpText="Max 16 characters. Leave blank to keep the saved password."
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={
              connectionStatus === "testing" ||
              !partnerId ||
              !signKey ||
              !username ||
              (!hasStoredPassword && !password)
            }
          >
            {connectionStatus === "testing" ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Credentials"}
          </Button>

          {connectionStatus === "connected" && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-accent-success">
              <CheckCircle className="h-4 w-4" />
              Connected
            </span>
          )}
          {connectionStatus === "invalid" && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-accent-danger">
              <XCircle className="h-4 w-4" />
              Invalid credentials
            </span>
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
