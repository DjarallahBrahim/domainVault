import { describe, expect, it } from "vitest";
import { isValidAsciiDomain, toAsciiDomain } from "@/lib/afternic/names";

describe("toAsciiDomain", () => {
  it("lowercases and punycodes IDNs", () => {
    expect(toAsciiDomain("Exämple.DE")).toBe("xn--exmple-cua.de");
  });

  it("strips protocol, path, port and query", () => {
    expect(toAsciiDomain("https://Example.com:8080/path?q=1")).toBe("example.com");
  });

  it("trims whitespace and trailing dots", () => {
    expect(toAsciiDomain("  example.com.  ")).toBe("example.com");
  });

  it("returns an empty string for empty input", () => {
    expect(toAsciiDomain("   ")).toBe("");
  });
});

describe("isValidAsciiDomain", () => {
  it("accepts a normal domain", () => {
    expect(isValidAsciiDomain("example.com")).toBe(true);
  });

  it("rejects invalid hosts", () => {
    expect(isValidAsciiDomain("not a domain")).toBe(false);
  });
});
