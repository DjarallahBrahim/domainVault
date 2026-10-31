"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchAtomApiToken } from "@/lib/supabase/queries/settings-client";
import { SecretField } from "@/components/settings/secret-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ConnectionStatus = "idle" | "testing" | "connected" | "invalid";

export function AtomCredentialsForm() {
  const [apiToken, setApiToken] = useState("");
  const [userId, setUserId] = useState("");
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_settings")
        .select("atom_api_token, atom_user_id")
        .maybeSingle();

      if (data) {
        const settings = data as Record<string, unknown>;
        if (settings.atom_user_id !== null && settings.atom_user_id !== undefined) {
          setUserId(String(settings.atom_user_id));
        }
        setHasStoredToken(Boolean(settings.atom_api_token));
      }

      setLoaded(true);
    }

    loadSettings();
  }, []);

  async function handleTestConnection() {
    setConnectionStatus("testing");
    try {
      // Test the values currently in the form so the user can verify before
      // saving. The route falls back to the saved token when one is omitted.
      const response = await fetch("/api/atom/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: apiToken.trim(),
          userId: userId.trim(),
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
    if (!userId.trim() || !Number.isInteger(Number(userId))) {
      toast.error("A numeric Atom User ID is required");
      return;
    }
    if (!hasStoredToken && !apiToken.trim()) {
      toast.error("API Token is required");
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
        atom_user_id: Number(userId),
      };
      if (apiToken.trim()) payload.atom_api_token = apiToken.trim();

      const { error } = await supabase
        .from("user_settings")
        .upsert(payload as never, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Atom credentials saved");
      setConnectionStatus("idle");
      setHasStoredToken(true);
      setApiToken("");
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
          <CardTitle>Atom API Credentials</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atom API Credentials</CardTitle>
        <CardDescription>
          Connect your Atom seller account to manage marketplace listings directly from DNfly.io
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SecretField
          id="atom-api-token"
          label="API Token"
          value={apiToken}
          onChange={setApiToken}
          hasStoredSecret={hasStoredToken}
          fetchStoredSecret={fetchAtomApiToken}
          placeholder={hasStoredToken ? "••••••••  (saved)" : "Enter your Atom API Token"}
          helpText="Leave blank to keep the saved token."
          visibleMs={10000}
        />

        <div>
          <Label htmlFor="atom-user-id">User ID</Label>
          <Input
            id="atom-user-id"
            type="number"
            min="1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your Atom User ID"
            className="mt-1"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={connectionStatus === "testing" || !userId || (!hasStoredToken && !apiToken)}
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
          Create an API token in{" "}
          <a
            href="https://www.atom.com/dashboard/seller/api-access"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary underline"
          >
            Atom → Seller Dashboard → API Access
          </a>
          . Your User ID is shown next to the token.
        </p>
      </CardContent>
    </Card>
  );
}
