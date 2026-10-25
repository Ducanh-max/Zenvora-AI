"use client";

import { useEffect, useState } from "react";
import { isProductionWebsite } from "@/lib/firebase-app";
import styles from "./firebase-services.module.css";

export default function FirebaseServices() {
  const [announcement, setAnnouncement] = useState("");
  const [dismissed, setDismissed] = useState("");
  useEffect(() => {
    if (!isProductionWebsite()) return;
    let active = true;
    void import("@/lib/firebase-remote-config")
      .then(({ getWebAnnouncement }) => getWebAnnouncement())
      .then((message) => { if (active) setAnnouncement(message); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return announcement && announcement !== dismissed ? <aside className={styles.notice} aria-label="Thông báo AUNORA">
    <span>{announcement}</span>
    <button type="button" aria-label="Đóng thông báo" onClick={() => setDismissed(announcement)}>×</button>
  </aside> : null;
}
