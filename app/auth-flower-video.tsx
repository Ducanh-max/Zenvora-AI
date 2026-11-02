"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./auth-garden.module.css";

type AuthFlowerVideoProps = { variant: "login" | "register" };

export default function AuthFlowerVideo({ variant }: AuthFlowerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const panel = panelRef.current;
    if (!video || !panel) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    const bounds = panel.getBoundingClientRect();
    let inView = bounds.bottom > 0 && bounds.top < window.innerHeight;

    async function syncPlayback() {
      if (disposed || video!.error) return;
      if (motion.matches || !inView || document.hidden) {
        video!.pause();
        return;
      }
      try {
        await video!.play();
        if (disposed || document.hidden || !inView || motion.matches) video!.pause();
      } catch {
        // Keep the poster visible if the browser declines muted autoplay.
      }
    }

    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(entries => {
          inView = Boolean(entries[0]?.isIntersecting);
          void syncPlayback();
        }, { threshold: 0.1 })
      : null;
    observer?.observe(panel);
    const sync = () => { void syncPlayback(); };
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    void syncPlayback();

    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      video.pause();
    };
  }, []);

  return <aside className={styles.garden} ref={panelRef} aria-label={variant === "login" ? "Bông hoa trên trang đăng nhập AUNORA" : "Bông hoa trên trang đăng ký AUNORA"}>
    <div className={styles.videoStage}>
      <img className={styles.videoPoster} src="/videos/aunora-flower-auth-poster-v2.jpg" alt="" aria-hidden="true" width={864} height={544}/>
      <video
        ref={videoRef}
        className={`${styles.flowerVideo} ${failed ? styles.videoFailed : ""}`}
        src="/videos/aunora-flower-auth-v2.mp4"
        poster="/videos/aunora-flower-auth-poster-v2.jpg"
        width={864}
        height={544}
        muted
        loop
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        preload="metadata"
        tabIndex={-1}
        aria-label="Vòng đời của một bông hoa phát sáng"
        onError={() => setFailed(true)}
      />
    </div>
  </aside>;
}
