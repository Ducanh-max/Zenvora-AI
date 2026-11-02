import type { Metadata } from "next";
import { Suspense } from "react";
import ScrollToTop from "./scroll-to-top";
import FirebaseServices from "./firebase-services";
import OnlinePresenceProvider from "./online-presence-provider";
import PreferencesProvider from "./preferences-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "AUNORA — Học tiếng Anh cùng AI",
  description: "Nuôi dưỡng tiếng Anh mỗi ngày cùng AUNORA và gia sư AI.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" data-theme="dark" data-language="vi" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "(function(){var t='dark',l='vi';try{var a=localStorage.getItem('aunora_theme'),b=localStorage.getItem('aunora_language');if(a==='light'||a==='dark')t=a;if(b==='en'||b==='vi')l=b;}catch(e){}document.documentElement.dataset.theme=t;document.documentElement.dataset.language=l;document.documentElement.lang=l;document.documentElement.style.colorScheme=t;})();" }}/></head><body><PreferencesProvider><OnlinePresenceProvider>{children}<Suspense fallback={null}><ScrollToTop /><FirebaseServices /></Suspense></OnlinePresenceProvider></PreferencesProvider></body></html>;
}




