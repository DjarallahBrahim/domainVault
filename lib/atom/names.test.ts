import { describe, expect, it } from "vitest";
import { isValidAsciiDomain, toAsciiDomain } from "@/lib/atom/names";

describe("toAsciiDomain", () => {
  it("lowercases and strips protocol/path", () => {
    expect(toAsciiDomain("HTTPS://Example.COM/path")).toBe("example.com");
  });

  it("converts IDNs to punycode", () => {
    expect(toAsciiDomain("exämple.de")).toBe("xn--exmple-cua.de");
  });

  it("returns an empty string for blank input", () => {
    expect(toAsciiDomain("   ")).toBe("");
  });
});

describe("isValidAsciiDomain", () => {
  it("accepts ordinary domains", () => {
    expect(isValidAsciiDomain("example.com")).toBe(true);
  });

  it("rejects strings without a dot", () => {
    expect(isValidAsciiDomain("example")).toBe(false);
  });
});
