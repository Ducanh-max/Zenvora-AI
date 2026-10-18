import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AUNORA — Learn • Grow • Glow",
  description: "Học tiếng Anh thông minh cùng AUNORA.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
