"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isProductionWebsite, privacyOptOut } from "@/lib/firebase-app";
import { CONSENT_KEY, setAnalyticsConsent, trackPage } from "@/lib/firebase-analytics";
import styles from "./firebase-services.module.css";

export default function FirebaseServices() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [dismissed, setDismissed] = useState("");

  useEffect(() => {
    if (!isProductionWebsite()) return;
    try { setChoice(localStorage.getItem(CONSENT_KEY)); } catch { /* Optional storage. */ }
    setReady(!privacyOptOut());
    let active = true;
    void import("@/lib/firebase-remote-config")
      .then(({ getWebAnnouncement }) => getWebAnnouncement())
      .then((message) => { if (active) setAnnouncement(message); })
      .catch(() => {});
    const sync = (event: StorageEvent) => {
      if (event.key === CONSENT_KEY) {
        setChoice(event.newValue);
        void setAnalyticsConsent(event.newValue === "granted").catch(() => {});
      }
    };
    window.addEventListener("storage", sync);
    return () => { active = false; window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    if (choice === "granted" && pathname) void trackPage(pathname).catch(() => {});
  }, [pathname, choice]);

  async function choose(granted: boolean) {
    await setAnalyticsConsent(granted).catch(() => {});
    setChoice(granted ? "granted" : "denied");
    setSettingsOpen(false);
  }

  return <>
    {announcement && announcement !== dismissed ? <aside className={styles.notice} aria-label="Thông báo AUNORA">
      <span>{announcement}</span>
      <button type="button" aria-label="Đóng thông báo" onClick={() => setDismissed(announcement)}>×</button>
    </aside> : null}
    {ready && (choice === null || settingsOpen) ? <section className={styles.consent} aria-label="Lựa chọn thống kê">
      <p><strong>Giúp AUNORA cải thiện trải nghiệm</strong><br />Cho phép dùng Google Analytics để thống kê lượt xem và cách sử dụng các trang học. Bạn có thể từ chối và vẫn học bình thường. Không gửi nội dung bạn nhập vào bài học hay thông tin thanh toán.</p>
      <div className={styles.actions}>
        <button type="button" onClick={() => void choose(false)}>Từ chối</button>
        <button type="button" onClick={() => void choose(true)}>Đồng ý thống kê</button>
      </div>
    </section> : ready ? <button type="button" className={styles.settings} onClick={() => setSettingsOpen(true)}>Tùy chọn thống kê</button> : null}
  </>;
}
