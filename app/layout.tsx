import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Zenvora AI — Học tiếng Anh thông minh",
  description: "Nền tảng học tiếng Anh tương tác cùng AI.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
