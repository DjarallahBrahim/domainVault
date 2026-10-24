import { afterEach, describe, expect, it, vi } from "vitest";
import { AfternicError, callAfternic } from "@/lib/afternic/client";

const credentials = { apiKey: "test-key", apiSecret: "test-secret" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("callAfternic", () => {
  it("retries a 429 once, honouring Retry-After", async () => {
    let calls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response(
            JSON.stringify({ code: "RATE_LIMIT_EXCEEDED", message: "Too many" }),
            { status: 429, headers: { "retry-after": "0.01" } }
          );
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      })
    );

    const result = await callAfternic(credentials, "GET", "/domains?limit=1");

    expect(result).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it("throws AfternicError with the API status on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              code: "AUTH_CODE_API_KEY_SECRET_INVALID",
              message: "Invalid credentials",
            }),
            { status: 401 }
          )
      )
    );

    await expect(callAfternic(credentials, "GET", "/domains?limit=1")).rejects.toBeInstanceOf(
      AfternicError
    );
  });

  it("handles a 204 with no body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 }))
    );

    const result = await callAfternic(credentials, "DELETE", "/domains/example.com");

    expect(result).toBeUndefined();
  });
});
