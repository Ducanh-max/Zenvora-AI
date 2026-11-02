"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./auth-garden.module.css";

type AuthFlowerVideoProps = { variant: "login" | "register" };

export default function AuthFlowerVideo({ variant }: AuthFlowerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wantsPlayback = useRef(false);
  const inView = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const panel = panelRef.current;
    if (!video || !panel) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    wantsPlayback.current = !motion.matches;
    const bounds = panel.getBoundingClientRect();
    inView.current = bounds.bottom > 0 && bounds.top < window.innerHeight;

    async function syncPlayback() {
      if (disposed || video!.error) return;
      if (!wantsPlayback.current || !inView.current || document.hidden) {
        video!.pause();
        return;
      }
      try {
        await video!.play();
        if (disposed || document.hidden || !inView.current || !wantsPlayback.current) video!.pause();
      } catch {
        // Autoplay may be blocked; the poster and manual play button remain usable.
        if (!disposed) setPlaying(false);
      }
    }

    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(entries => {
          inView.current = Boolean(entries[0]?.isIntersecting);
          void syncPlayback();
        }, { threshold: 0.1 })
      : null;
    observer?.observe(panel);
    const visibilityChanged = () => { void syncPlayback(); };
    const motionChanged = () => {
      wantsPlayback.current = !motion.matches;
      void syncPlayback();
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    motion.addEventListener("change", motionChanged);
    void syncPlayback();

    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      motion.removeEventListener("change", motionChanged);
      video.pause();
    };
  }, []);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || failed) return;
    if (!video.paused) {
      wantsPlayback.current = false;
      video.pause();
      return;
    }
    wantsPlayback.current = true;
    try {
      await video.play();
    } catch {
      wantsPlayback.current = false;
      setPlaying(false);
    }
  }

  return <aside className={styles.garden} ref={panelRef} aria-label="Khoảnh khắc nảy nở cùng AUNORA">
    <div className={styles.gardenHeading}>
      <span className={styles.eyebrow}>AUNORA IN BLOOM</span>
      <span className={styles.gardenChapter}>GROW AT YOUR OWN PACE</span>
    </div>
    <figure className={styles.flowerFigure}>
      <div className={styles.videoStage}>
        <img className={styles.videoPoster} src="/videos/aunora-flower-auth-poster-v1.jpg" alt="" aria-hidden="true" width={432} height={272}/>
        <video
          ref={videoRef}
          className={`${styles.flowerVideo} ${failed ? styles.videoFailed : ""}`}
          src="/videos/aunora-flower-auth-v1.mp4"
          poster="/videos/aunora-flower-auth-poster-v1.jpg"
          width={432}
          height={272}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Vòng đời của một bông hoa phát sáng: nảy mầm, nở hoa và bắt đầu lại"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => {
            wantsPlayback.current = false;
            setPlaying(false);
            setFailed(true);
          }}
        />
      </div>
      <figcaption className={styles.videoCaption}>Nảy mầm. Nở hoa. Một khởi đầu mới.</figcaption>
    </figure>
    <div className={styles.videoToolbar}>
      <span className={styles.videoSoundNote}>Một chút cảm hứng, trước mỗi bài học.</span>
      {!failed ? <button className={styles.videoToggle} type="button" onClick={togglePlayback} aria-label={playing ? "Tạm dừng video bông hoa" : "Phát video bông hoa"}>
        <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{playing ? "Tạm dừng" : "Phát video"}
      </button> : <span className={styles.videoUnavailable} role="status">Video tạm thời chưa tải được.</span>}
    </div>
    <p className={styles.gardenQuote}>{variant === "login" ? <>Confidence grows<br/><em>with practice.</em></> : <>Small beginnings.<br/><em>Beautiful possibilities.</em></>}</p>
  </aside>;
}
