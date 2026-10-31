import { afterEach, describe, expect, it, vi } from "vitest";
import { AtomError, assertAtomSuccess, callAtom } from "@/lib/atom/client";

const credentials = { apiToken: "test-token", userId: 12345 };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("callAtom", () => {
  it("sends the api_token and user_id as query parameters", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      })
    );

    await callAtom(credentials, "GET", "/domains", { limit: 1, page: 2 });

    const parsed = new URL(calls[0].url);
    expect(parsed.searchParams.get("api_token")).toBe("test-token");
    expect(parsed.searchParams.get("user_id")).toBe("12345");
    expect(parsed.searchParams.get("limit")).toBe("1");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(calls[0].init?.cache).toBe("no-store");
  });

  it("retries a 429 once, honouring Retry-After", async () => {
    let calls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response(JSON.stringify({ message: "Too many" }), {
            status: 429,
            headers: { "retry-after": "0.01" },
          });
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      })
    );

    const result = await callAtom(credentials, "GET", "/domains");

    expect(result).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it("throws AtomError with the API status on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "Invalid credentials" }), {
            status: 401,
          })
      )
    );

    await expect(callAtom(credentials, "GET", "/domains")).rejects.toBeInstanceOf(AtomError);
  });

  it("never includes the token in the thrown error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
          })
      )
    );

    try {
      await callAtom(credentials, "GET", "/domains");
    } catch (error) {
      expect((error as Error).message).not.toContain(credentials.apiToken);
    }
  });

  it("handles a 204 with no body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 }))
    );

    const result = await callAtom(credentials, "GET", "/remove-domain");

    expect(result).toBeUndefined();
  });
});

describe("assertAtomSuccess", () => {
  it("accepts success messages", () => {
    expect(() =>
      assertAtomSuccess({ message: "Successfully updated selling price" })
    ).not.toThrow();
    expect(() => assertAtomSuccess({ message: "Successfully removed the domain" })).not.toThrow();
  });

  it("throws when Atom returns a failure inside a 200 response", () => {
    expect(() => assertAtomSuccess({ message: "Domain not found" })).toThrow(AtomError);
    expect(() => assertAtomSuccess({ message: "Unable to update price" })).toThrow(AtomError);
  });
});
