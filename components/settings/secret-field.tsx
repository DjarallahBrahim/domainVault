"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SecretFieldProps {
  id: string;
  label: string;
  /** The value the user is typing (a new secret), never preloaded from the DB. */
  value: string;
  onChange: (value: string) => void;
  /** Whether a secret is already stored, so the eye can fetch it on demand. */
  hasStoredSecret: boolean;
  /** Fetches the stored secret from the server. Only called on reveal. */
  fetchStoredSecret: () => Promise<string | null>;
  placeholder?: string;
  maxLength?: number;
  helpText?: string;
  /** How long a fetched secret stays on screen, in ms. */
  visibleMs?: number;
}

/**
 * Password/secret input that never keeps the stored value in the browser by
 * default. Clicking the eye fetches it from the server, shows it for a few
 * seconds, then hides it and drops it from memory.
 */
export function SecretField({
  id,
  label,
  value,
  onChange,
  hasStoredSecret,
  fetchStoredSecret,
  placeholder,
  maxLength,
  helpText,
  visibleMs = 10000,
}: SecretFieldProps) {
  const [typedVisible, setTypedVisible] = useState(false);
  const [storedSecret, setStoredSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const revealing = storedSecret !== null;
  const shown = revealing || typedVisible;

  useEffect(() => {
    if (!revealing) return;
    setSecondsLeft(Math.ceil(visibleMs / 1000));
    const interval = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000
    );
    const timeout = setTimeout(() => setStoredSecret(null), visibleMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [revealing, visibleMs]);

  async function handleToggle() {
    if (revealing) {
      setStoredSecret(null);
      return;
    }
    if (value) {
      setTypedVisible((v) => !v);
      return;
    }
    if (!hasStoredSecret) {
      toast.error("No saved password to show");
      return;
    }

    setLoading(true);
    try {
      const secret = await fetchStoredSecret();
      if (secret) {
        setStoredSecret(secret);
      } else {
        toast.error("No saved password found");
      }
    } catch {
      toast.error("Could not retrieve the saved password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          value={revealing ? storedSecret : value}
          readOnly={revealing}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="new-password"
          className="pr-10"
        />
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          aria-label={shown ? "Hide password" : "Show saved password"}
          aria-pressed={shown}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
          tabIndex={-1}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : shown ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {revealing ? `Hidden automatically in ${secondsLeft}s` : helpText}
      </p>
    </div>
  );
}
