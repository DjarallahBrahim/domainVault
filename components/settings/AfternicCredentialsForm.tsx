"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchAfternicApiSecret } from "@/lib/supabase/queries/settings-client";
import { SecretField } from "@/components/settings/secret-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ConnectionStatus = "idle" | "testing" | "connected" | "invalid";

export function AfternicCredentialsForm() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_settings")
        .select("afternic_api_key, afternic_api_secret")
        .maybeSingle();

      if (data) {
        const settings = data as Record<string, unknown>;
        if (settings.afternic_api_key) {
          setApiKey(String(settings.afternic_api_key));
        }
        setHasStoredSecret(Boolean(settings.afternic_api_secret));
      }

      setLoaded(true);
    }

    loadSettings();
  }, []);

  async function handleTestConnection() {
    setConnectionStatus("testing");
    try {
      // Test the values currently in the form so the user can verify before
      // saving. The route falls back to the saved secret when one is omitted.
      const response = await fetch("/api/afternic/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && body?.data?.valid) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("invalid");
      }
    } catch {
      setConnectionStatus("invalid");
    }
  }

  async function handleSave() {
    if (!apiKey.trim()) {
      toast.error("API Key is required");
      return;
    }
    if (!hasStoredSecret && !apiSecret.trim()) {
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
        afternic_api_key: apiKey.trim(),
      };
      if (apiSecret.trim()) payload.afternic_api_secret = apiSecret.trim();

      const { error } = await supabase
        .from("user_settings")
        .upsert(payload as never, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Afternic credentials saved");
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
          <CardTitle>Afternic API Credentials</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Afternic API Credentials</CardTitle>
        <CardDescription>
          Connect your Afternic account to manage marketplace listings directly from DNfly.io
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="afternic-api-key">API Key</Label>
          <Input
            id="afternic-api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Afternic API Key"
            className="mt-1"
          />
        </div>

        <SecretField
          id="afternic-api-secret"
          label="API Secret"
          value={apiSecret}
          onChange={setApiSecret}
          hasStoredSecret={hasStoredSecret}
          fetchStoredSecret={fetchAfternicApiSecret}
          placeholder={hasStoredSecret ? "••••••••  (saved)" : "Enter your API Secret"}
          helpText="Leave blank to keep the saved secret."
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={connectionStatus === "testing" || !apiKey || (!hasStoredSecret && !apiSecret)}
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

        <p className="pt-2 text-xs text-text-muted">
          Create an API key in{" "}
          <a
            href="https://www.afternic.com/account/profile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary underline"
          >
            Afternic → Account Profile → Security → API Keys
          </a>
          . Save the secret immediately — you can have at most 2 keys.
        </p>
      </CardContent>
    </Card>
  );
}
