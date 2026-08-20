import { describe, expect, it } from "vitest";
import { parseSignatureHeader, timingSafeEqual, verifyStripeSignature } from "@/lib/stripe-signature";

const SECRET = "whsec_test_secret_value_for_unit_tests";
const PAYLOAD = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
const NOW = 1_750_000_000;

async function sign(payload: string, secret: string, timestamp: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

describe("timingSafeEqual", () => {
  it("matches identical strings", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
  });

  it("rejects different strings of equal length", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
  });

  it("rejects different lengths", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("parseSignatureHeader", () => {
  it("extracts timestamp and every v1 signature", () => {
    const parsed = parseSignatureHeader("t=123, v1=aaa, v1=bbb, v0=ignored");
    expect(parsed.timestamp).toBe("123");
    expect(parsed.signatures).toEqual(["aaa", "bbb"]);
  });

  it("reports a missing timestamp", () => {
    expect(parseSignatureHeader("v1=aaa").timestamp).toBeNull();
  });
});

describe("verifyStripeSignature", () => {
  it("accepts a correctly signed payload", async () => {
    const header = `t=${NOW},v1=${await sign(PAYLOAD, SECRET, NOW)}`;
    expect(await verifyStripeSignature(PAYLOAD, header, SECRET, { nowSeconds: NOW })).toBe(true);
  });

  it("accepts when one of several signatures matches (key rotation)", async () => {
    const good = await sign(PAYLOAD, SECRET, NOW);
    const header = `t=${NOW},v1=${"0".repeat(64)},v1=${good}`;
    expect(await verifyStripeSignature(PAYLOAD, header, SECRET, { nowSeconds: NOW })).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const header = `t=${NOW},v1=${await sign(PAYLOAD, SECRET, NOW)}`;
    const tampered = JSON.stringify({ id: "evt_1", type: "invoice.paid", amount_paid: 999999 });
    expect(await verifyStripeSignature(tampered, header, SECRET, { nowSeconds: NOW })).toBe(false);
  });

  it("rejects a signature made with a different secret", async () => {
    const header = `t=${NOW},v1=${await sign(PAYLOAD, "whsec_wrong", NOW)}`;
    expect(await verifyStripeSignature(PAYLOAD, header, SECRET, { nowSeconds: NOW })).toBe(false);
  });

  it("rejects a replayed event outside the tolerance window", async () => {
    const old = NOW - 400;
    const header = `t=${old},v1=${await sign(PAYLOAD, SECRET, old)}`;
    expect(await verifyStripeSignature(PAYLOAD, header, SECRET, { nowSeconds: NOW })).toBe(false);
  });

  it("accepts an event just inside the tolerance window", async () => {
    const recent = NOW - 299;
    const header = `t=${recent},v1=${await sign(PAYLOAD, SECRET, recent)}`;
    expect(await verifyStripeSignature(PAYLOAD, header, SECRET, { nowSeconds: NOW })).toBe(true);
  });

  it("rejects a missing or malformed header", async () => {
    expect(await verifyStripeSignature(PAYLOAD, "", SECRET, { nowSeconds: NOW })).toBe(false);
    expect(await verifyStripeSignature(PAYLOAD, "garbage", SECRET, { nowSeconds: NOW })).toBe(false);
    expect(await verifyStripeSignature(PAYLOAD, `t=abc,v1=${"0".repeat(64)}`, SECRET, { nowSeconds: NOW })).toBe(false);
  });

  it("rejects when no secret is configured", async () => {
    const header = `t=${NOW},v1=${await sign(PAYLOAD, SECRET, NOW)}`;
    expect(await verifyStripeSignature(PAYLOAD, header, "", { nowSeconds: NOW })).toBe(false);
  });
});
