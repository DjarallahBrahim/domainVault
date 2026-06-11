"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SpaceshipCredentialsForm() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase.from("user_settings").select("spaceship_api_key, spaceship_api_secret").single();

      if (data) {
        const settings = data as Record<string, unknown>;
        if (settings.spaceship_api_key) setApiKey(String(settings.spaceship_api_key));
        if (settings.spaceship_api_secret) setApiSecret(String(settings.spaceship_api_secret));
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
    if (!apiKey || !apiSecret) {
      toast.error("Both fields are required");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          spaceship_api_key: apiKey,
          spaceship_api_secret: apiSecret,
        } as never,
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast.success("Spaceship credentials saved");
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
          Connect your Spaceship account to manage SellerHub listings directly from DomainVault
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

        <div>
          <Label htmlFor="spaceship-api-secret">API Secret</Label>
          <div className="relative mt-1">
            <Input
              id="spaceship-api-secret"
              type={showSecret ? "text" : "password"}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={apiSecret ? "••••••••" : "Enter your API Secret"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              tabIndex={-1}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={connectionStatus === "testing" || !apiKey || !apiSecret}
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
