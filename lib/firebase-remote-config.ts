import { getFirebaseApp, isProductionWebsite } from "./firebase-app";

export async function getWebAnnouncement(): Promise<string> {
  if (!isProductionWebsite()) return "";
  const sdk = await import("firebase/remote-config");
  if (!(await sdk.isSupported())) return "";
  const config = sdk.getRemoteConfig(getFirebaseApp());
  config.settings = { minimumFetchIntervalMillis: 12 * 60 * 60 * 1000, fetchTimeoutMillis: 5000 };
  config.defaultConfig = { web_announcement_enabled: false, web_announcement: "" };
  try { await sdk.fetchAndActivate(config); } catch { /* Cached/default settings still work offline. */ }
  return sdk.getBoolean(config, "web_announcement_enabled") ?
    sdk.getString(config, "web_announcement").trim().slice(0, 300) : "";
}
