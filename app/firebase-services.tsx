"use client";

import { useEffect, useState } from "react";
import styles from "./firebase-services.module.css";

export default function FirebaseServices() {
  const [announcement, setAnnouncement] = useState("");
  const [dismissed, setDismissed] = useState("");
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || window.location.hostname !== "zenvora-ai-alpha.vercel.app") return;
    let active = true;
    const load = () => {
      if (!active) return;
      void import("@/lib/firebase-remote-config")
        .then(({ getWebAnnouncement }) => active ? getWebAnnouncement() : "")
        .then((message) => { if (active) setAnnouncement(message); })
        .catch(() => {});
    };
    // Announcements should not compete with the first interactive screen.
    const idle = window.requestIdleCallback?.(load, { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(load, 1200) : undefined;
    return () => {
      active = false;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);
  return announcement && announcement !== dismissed ? <aside className={styles.notice} aria-label="Thông báo AUNORA">
    <span>{announcement}</span>
    <button type="button" aria-label="Đóng thông báo" onClick={() => setDismissed(announcement)}>×</button>
  </aside> : null;
}
