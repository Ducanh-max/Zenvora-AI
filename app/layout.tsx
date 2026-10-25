import type { Metadata } from "next";
import { Suspense } from "react";
import FirebaseServices from "./firebase-services";
import OnlinePresenceProvider from "./online-presence-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "AUNORA — Learn • Grow • Glow",
  description: "Học tiếng Anh thông minh cùng AUNORA.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><OnlinePresenceProvider>{children}<Suspense fallback={null}><FirebaseServices /></Suspense></OnlinePresenceProvider></body></html>;
}



