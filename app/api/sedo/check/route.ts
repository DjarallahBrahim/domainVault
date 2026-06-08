import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DOMParser } from "@xmldom/xmldom";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";

const SEDO_BASE = "https://api.sedo.com/api/v1";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const settings = await fetchUserSettings();
    if (
      !settings?.sedo_partner_id ||
      !settings?.sedo_signkey ||
      !settings?.sedo_username ||
      !settings?.sedo_password
    ) {
      return NextResponse.json(
        { error: "Sedo credentials not configured" },
        { status: 401 }
      );
    }

    const params = new URLSearchParams({
      output_method: "xml",
      partnerid: String(settings.sedo_partner_id),
      signkey: settings.sedo_signkey,
      username: settings.sedo_username,
      password: settings.sedo_password,
    });

    const url = `${SEDO_BASE}/CheckMember?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/xml" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not reach Sedo. Try again." },
        { status: 500 }
      );
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");

    const faultElement = doc.documentElement;
    if (faultElement?.tagName === "SEDOFAULT") {
      return NextResponse.json({ data: { connected: false } });
    }

    const memberElements = doc.getElementsByTagName("member");
    const memberValue = memberElements[0]?.textContent;
    const connected = memberValue === "1";

    return NextResponse.json({ data: { connected } });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Sedo. Try again." },
      { status: 500 }
    );
  }
}
