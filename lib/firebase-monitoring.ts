import { getApps, initializeApp } from "firebase/app";

// Public Firebase web configuration, not a server credential.
const firebaseConfig = {
  apiKey: "AIzaSyCcd_mg_gfkZLBfCu2BNCpYYEGHh08-1fQ",
  authDomain: "aunora-81dcc.firebaseapp.com",
  projectId: "aunora-81dcc",
  appId: "1:442033772792:web:1632289ec74c21543bc30d",
};

export async function startFirebaseMonitoring() {
  if (typeof window === "undefined") return;
  if (navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl ||
      window.location.hostname !== "zenvora-ai-alpha.vercel.app") return;

  const { initializePerformance } = await import("firebase/performance");
  if (!("indexedDB" in window) || !("PerformanceObserver" in window)) return;
  const app = getApps().find((candidate) => candidate.name === "aunora-monitoring") ??
    initializeApp(firebaseConfig, "aunora-monitoring");
  initializePerformance(app, {
    instrumentationEnabled: true,
    dataCollectionEnabled: true,
  });
}

