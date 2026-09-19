"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchSpaceshipApiSecret } from "@/lib/supabase/queries/settings-client";
import { SecretField } from "@/components/settings/secret-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SpaceshipCredentialsForm() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      // Never preload the secret — it is fetched only when the user reveals it.
      const { data } = await supabase
        .from("user_settings")
        .select("spaceship_api_key")
        .maybeSingle();

      if (data) {
        const settings = data as Record<string, unknown>;
        if (settings.spaceship_api_key) setApiKey(String(settings.spaceship_api_key));
        setHasStoredSecret(Boolean(settings.spaceship_api_key));
      }

      setLoaded(true);
    }

    loadSettings();
  }, []);

  async function handleTestConnection() {
    setConnectionStatus("testing");
    try {
      const response = await fetch("/api/spaceship/list");

      if (response.status === 401 && !(await response.json()).error?.includes("credentials")) {
        setConnectionStatus("connected");
      } else if (response.ok) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("invalid");
      }
    } catch {
      setConnectionStatus("invalid");
    }
  }

  async function handleSave() {
    if (!apiKey) {
      toast.error("API Key is required");
      return;
    }
    if (!hasStoredSecret && !apiSecret) {
      toast.error("API Secret is required");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const payload: Record<string, unknown> = {
        user_id: user.id,
        spaceship_api_key: apiKey,
      };
      if (apiSecret) payload.spaceship_api_secret = apiSecret;

      const { error } = await supabase
        .from("user_settings")
        .upsert(payload as never, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Spaceship credentials saved");
      setConnectionStatus("idle");
      setHasStoredSecret(true);
      setApiSecret("");
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
          <CardTitle>Spaceship API Credentials</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spaceship API Credentials</CardTitle>
        <CardDescription>
          Connect your Spaceship account to manage SellerHub listings directly from DNfly.io
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="spaceship-api-key">API Key</Label>
          <Input
            id="spaceship-api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Spaceship API Key"
            className="mt-1"
          />
        </div>

        <SecretField
          id="spaceship-api-secret"
          label="API Secret"
          value={apiSecret}
          onChange={setApiSecret}
          hasStoredSecret={hasStoredSecret}
          fetchStoredSecret={fetchSpaceshipApiSecret}
          placeholder={hasStoredSecret ? "••••••••  (saved)" : "Enter your API Secret"}
          helpText="Leave blank to keep the saved secret."
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={
              connectionStatus === "testing" ||
              !apiKey ||
              (!hasStoredSecret && !apiSecret)
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
          Generate your API Key and Secret in{" "}
          <a
            href="https://spaceship.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary underline"
          >
            Spaceship API Manager
          </a>.
        </p>
      </CardContent>
    </Card>
  );
}
