"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, MessageCircle, RotateCcw, Sprout } from "lucide-react";
import styles from "./garden-home.module.css";

const features = [
  { Icon: BookOpen, tag: "BUILD YOUR FOUNDATION", title: "Bắt đầu từ nền tảng", text: "Từ vựng và tình huống thực tế." },
  { Icon: MessageCircle, tag: "FIND YOUR VOICE", title: "Tự tin cất lời", text: "Luyện nói, từng cuộc trò chuyện." },
  { Icon: Sprout, tag: "MEET YOUR AI COMPANION", title: "Có AI đồng hành", text: "Hỏi điều chưa rõ, học theo cách riêng." },
];

export default function HomeExperience({ signedIn }: { signedIn: boolean }) {
  const [finished, setFinished] = useState(false);
  const [cycle, setCycle] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const completedRef = useRef(false);
  const sendStart = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ type: completedRef.current ? "zenvora:garden-pause" : "zenvora:garden-start" }, window.location.origin);
  }, []);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "zenvora:garden-ready") sendStart();
      if (event.data.type === "zenvora:garden-complete") { completedRef.current = true; setFinished(true); }
    }
    window.addEventListener("message", receive);
    sendStart();
    return () => window.removeEventListener("message", receive);
  }, [cycle, sendStart]);

  useEffect(() => {
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (!finished) return;
    const active = document.activeElement;
    if (active === document.body || (active && introRef.current?.contains(active))) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [finished]);

  function skip() {
    completedRef.current = true;
    frameRef.current?.contentWindow?.postMessage({ type: "zenvora:garden-pause" }, window.location.origin);
    setFinished(true);
  }
  function replay() {
    completedRef.current = false;
    setFinished(false);
    setCycle(value => value + 1);
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="AUNORA — Trang chủ"><span className={styles.mark} aria-hidden="true"><Sprout size={22} strokeWidth={1.3}/></span><span>AUNORA<small>LEARN · GROW · GLOW</small></span></Link>
      <nav className={styles.navigation} aria-label="Điều hướng chính">
        <Link href={signedIn ? "/learn/profile" : "/login"} className={styles.login}>{signedIn ? "Tài khoản" : "Đăng nhập"}</Link>
        <Link href={signedIn ? "/learn" : "/register"} className={styles.headerButton}>{signedIn ? "Vào học" : "Đăng ký"}<ArrowRight size={15}/></Link>
      </nav>
    </header>
    <div className={styles.viewport}>
      <section ref={introRef} className={`${styles.intro} ${finished ? styles.introFinished : ""}`} aria-label="Kỹ năng lớn lên từ những điều nhỏ" aria-hidden={finished} inert={finished}>
        <div className={styles.story}><iframe key={cycle} ref={frameRef} onLoad={sendStart} src="/zenvora-garden/animation.html?intro=once" title="Hoạt cảnh khu vườn: cây rễ nông đổ trong mưa, cây được chăm sóc lớn lên với bộ rễ sâu" className={styles.frame} loading="eager" referrerPolicy="same-origin"/></div>
        <button className={styles.skip} type="button" onClick={skip}>Bỏ qua hoạt cảnh <ArrowRight size={13}/></button>
      </section>
      {finished ? <section className={styles.content} aria-labelledby="invitation-title">
        <div className={styles.invitation}>
          <p className={styles.eyebrow}><span aria-hidden="true"/> YOUR NEXT CHAPTER STARTS HERE</p>
          <h1 id="invitation-title" ref={headingRef} tabIndex={-1}>Tiếng Anh vững vàng.<br/><em>Từ những điều nhỏ.</em></h1>
          <p className={styles.lead}>Một bài học ngắn, một cuộc trò chuyện mới.<br/>Nuôi dưỡng sự tự tin của bạn mỗi ngày.</p>
          <div className={styles.actions}><Link className={styles.primary} href={signedIn ? "/learn" : "/register"}>{signedIn ? "Tiếp tục hành trình" : "Bắt đầu học miễn phí"}<ArrowRight size={17}/></Link><Link className={styles.secondary} href={signedIn ? "/learn/profile" : "/login"}>{signedIn ? "Tài khoản của bạn" : "Đã có tài khoản? Đăng nhập"}</Link></div>
        </div>
        <div className={styles.features} aria-label="Không gian học tiếng Anh">{features.map(({Icon,tag,title,text},i)=><article key={tag} className={styles.feature}><span className={styles.featureIcon}><Icon size={23} strokeWidth={1.5}/></span><div><span className={styles.featureTag}>{tag}</span><h2>{title}</h2><p>{text}</p></div><span className={styles.featureNumber}>0{i+1}</span></article>)}</div>
        <button className={styles.replay} type="button" onClick={replay}><RotateCcw size={13}/> Xem lại câu chuyện</button>
      </section> : null}
    </div>
    <span className={styles.announcement} role="status">{finished ? "Hoạt cảnh đã kết thúc. Phần giới thiệu và bắt đầu học đã xuất hiện." : "Hoạt cảnh đang chạy. Phần giới thiệu sẽ tự hiện khi kết thúc."}</span>
    <noscript><div className={styles.noScript}><h1>Học tiếng Anh cùng AUNORA</h1><Link href="/register">Đăng ký</Link><Link href="/login">Đăng nhập</Link></div></noscript>
  </main>;
}
