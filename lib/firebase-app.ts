import { getApps, initializeApp } from "firebase/app";

// These are public web identifiers, not server credentials.
export function getFirebaseApp() {
  return getApps().find((app) => app.name === "[DEFAULT]") ?? initializeApp({
    apiKey: "AIzaSyCcd_mg_gfkZLBfCu2BNCpYYEGHh08-1fQ",
    authDomain: "aunora-81dcc.firebaseapp.com",
    projectId: "aunora-81dcc",
    appId: "1:442033772792:web:1632289ec74c21543bc30d",
    measurementId: "G-C93HJX9EWQ",
  });
}

export function isProductionWebsite() {
  return typeof window !== "undefined" && process.env.NODE_ENV === "production" &&
    window.location.hostname === "zenvora-ai-alpha.vercel.app";
}

export function privacyOptOut() {
  return typeof navigator !== "undefined" && (navigator.doNotTrack === "1" ||
    Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl));
}


