import type { Analytics } from "firebase/analytics";
import { getFirebaseApp, isProductionWebsite, privacyOptOut } from "./firebase-app";

export const CONSENT_KEY = "aunora.analytics-consent.v1";
let analyticsPromise: Promise<Analytics | null> | undefined;

export function hasAnalyticsConsent() {
  if (!isProductionWebsite() || privacyOptOut()) return false;
  try { return localStorage.getItem(CONSENT_KEY) === "granted"; } catch { return false; }
}

async function analytics() {
  if (!hasAnalyticsConsent()) return null;
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const sdk = await import("firebase/analytics");
      if (!(await sdk.isSupported()) || !hasAnalyticsConsent()) return null;
      sdk.setConsent({ analytics_storage: "granted", ad_storage: "denied",
        ad_user_data: "denied", ad_personalization: "denied" });
      return sdk.initializeAnalytics(getFirebaseApp(), { config: {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: window.location.origin,
        page_referrer: "",
      } });
    })().catch(() => { analyticsPromise = undefined; return null; });
  }
  return analyticsPromise;
}

export async function setAnalyticsConsent(granted: boolean) {
  try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch { /* Storage can be blocked. */ }
  if (!analyticsPromise) return;
  const instance = await analyticsPromise;
  if (!instance) { analyticsPromise = undefined; return; }
  const sdk = await import("firebase/analytics");
  const enabled = granted && hasAnalyticsConsent();
  sdk.setAnalyticsCollectionEnabled(instance, enabled);
  sdk.setConsent({ analytics_storage: enabled ? "granted" : "denied",
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
}

// Never include query strings, user IDs, entered text, scores, or payment data.
export async function trackPage(pathname: string) {
  if (!hasAnalyticsConsent()) return;
  // Only known public learning routes, never authentication callbacks or payments.
  if (!/^\/(?:$|about$|courses$|login$|register$|learn(?:\/|$))/.test(pathname)) return;
  if (pathname.startsWith("/learn/profile")) return;
  const safePath = pathname.replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 120);
  const instance = await analytics();
  if (!instance || !hasAnalyticsConsent()) return;
  const { logEvent } = await import("firebase/analytics");
  logEvent(instance, "page_view", { page_location: window.location.origin + safePath,
    page_path: safePath, page_title: "AUNORA", page_referrer: "" });
}
