import { getFirebaseApp, isProductionWebsite, privacyOptOut } from "./firebase-app";

export async function startFirebaseMonitoring() {
  if (!isProductionWebsite() || privacyOptOut()) return;
  if (!("indexedDB" in window) || !("PerformanceObserver" in window)) return;
  const { initializePerformance } = await import("firebase/performance");
  initializePerformance(getFirebaseApp(), {
    instrumentationEnabled: true,
    dataCollectionEnabled: true,
  });
}
