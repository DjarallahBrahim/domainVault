import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchRegistrar } from "@/lib/registrars";

const WHOISJSON_BASE = "https://whoisjson.com/api/v1/whois";
const TIMEOUT_MS = 10000;

const HOSTNAME_REGEX =
  /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.[A-Za-z]{2,}$/;

function extractRegistrarName(data: Record<string, unknown>): string | null {
  const registrar = data?.registrar;
  if (registrar == null) return null;
  if (typeof registrar === "string") return registrar.trim() || null;
  if (typeof registrar === "object") {
    const name = (registrar as { name?: unknown }).name;
    if (typeof name === "string") return name.trim() || null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const domain = (request.nextUrl.searchParams.get("domain") ?? "").trim().toLowerCase();

    if (!domain) {
      return NextResponse.json({ error: "Missing required field: domain" }, { status: 400 });
    }
    if (domain.length > 253 || !HOSTNAME_REGEX.test(domain)) {
      return NextResponse.json({ error: "Invalid domain name" }, { status: 400 });
    }

    const apiKey = process.env.WHOISJSON_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "WHOIS lookup is not configured" }, { status: 503 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${WHOISJSON_BASE}?domain=${encodeURIComponent(domain)}`, {
        headers: {
          Authorization: `TOKEN=${apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });
    } catch {
      return NextResponse.json(
        { error: "Could not reach WHOIS service. Try again." },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      return NextResponse.json(
        { error: "WHOIS request limit reached. Try again later." },
        { status: 429 }
      );
    }
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ error: "WHOIS service rejected the API key." }, { status: 502 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: "WHOIS lookup failed. Try again." }, { status: 502 });
    }

    const data = (await response.json()) as Record<string, unknown>;
    const registered = data?.registered === true;
    const rawRegistrar = extractRegistrarName(data);
    const canonical = matchRegistrar(rawRegistrar);
    const expiresValue = typeof data?.expires === "string" ? data.expires : null;
    const expirationDate =
      registered && expiresValue && !expiresValue.startsWith("0000")
        ? expiresValue.slice(0, 10)
        : null;

    return NextResponse.json({
      data: {
        domain,
        registered,
        expirationDate,
        registrar: {
          value: canonical,
          raw: rawRegistrar,
          allowed: rawRegistrar === null ? true : canonical !== null,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "WHOIS lookup failed. Try again." }, { status: 500 });
  }
}
