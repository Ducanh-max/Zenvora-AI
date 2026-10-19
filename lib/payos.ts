import { createHmac, timingSafeEqual } from "node:crypto";

export const PAID_PLANS = {
  plus: { name: "Aunora Explorer", amount: 49000, description: "AUNORA EXPLORER" },
  pro: { name: "Aunora Achiever", amount: 99000, description: "AUNORA ACHIEVER" },
  elite: { name: "Aunora Mastery", amount: 149000, description: "AUNORA MASTERY" },
} as const;

export type PaidPlanId = keyof typeof PAID_PLANS;

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) =>
      item && typeof item === "object" ? sortObject(item as Record<string, unknown>) : item
    ));
  }
  if (typeof value === "object") return JSON.stringify(sortObject(value as Record<string, unknown>));
  return String(value);
}

function sortObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, input[key]]));
}

export function createPayOSSignature(data: Record<string, unknown>, checksumKey: string) {
  const payload = Object.keys(data).sort()
    .map((key) => `${key}=${normalizeValue(data[key])}`)
    .join("&");
  return createHmac("sha256", checksumKey).update(payload).digest("hex");
}

export function verifyPayOSWebhook(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string
) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(createPayOSSignature(data, checksumKey), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
