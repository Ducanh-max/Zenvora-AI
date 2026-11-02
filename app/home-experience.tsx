"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, MessageCircle, Sprout } from "lucide-react";
import PreferenceControls from "./preference-controls";
import { usePreferences } from "./preferences-provider";
import styles from "./garden-home.module.css";

const copy = {
  vi: { eyebrow: "HÀNH TRÌNH MỚI BẮT ĐẦU TỪ ĐÂY", home: "Trang chủ", nav: "Điều hướng chính", account: "Tài khoản", login: "Đăng nhập", learn: "Vào học", register: "Đăng ký", scene: "Kỹ năng lớn lên từ những điều nhỏ", sceneTitle: "Hoạt cảnh khu vườn: cây rễ nông đổ trong mưa, cây được chăm sóc lớn lên với bộ rễ sâu", skip: "Bỏ qua hoạt cảnh", heading: "Tiếng Anh vững vàng.", accent: "Từ những điều nhỏ.", lead: "Một bài học ngắn, một cuộc trò chuyện mới.", leadSecond: "Nuôi dưỡng sự tự tin của bạn mỗi ngày.", continue: "Tiếp tục hành trình", start: "Bắt đầu học miễn phí", profile: "Tài khoản của bạn", existing: "Đã có tài khoản? Đăng nhập", space: "Không gian học tiếng Anh", done: "Hoạt cảnh đã kết thúc. Phần giới thiệu và bắt đầu học đã xuất hiện.", running: "Hoạt cảnh đang chạy. Phần giới thiệu sẽ tự hiện khi kết thúc.", fallback: "Học tiếng Anh cùng AUNORA" },
  en: { eyebrow: "YOUR NEXT CHAPTER STARTS HERE", home: "Home", nav: "Main navigation", account: "Account", login: "Sign in", learn: "Start learning", register: "Sign up", scene: "Skills grow from small beginnings", sceneTitle: "A garden story: shallow roots fall in the rain, while a nurtured tree grows deep roots", skip: "Skip the story", heading: "English that takes root.", accent: "One small step at a time.", lead: "A short lesson. A new conversation.", leadSecond: "Grow your confidence a little every day.", continue: "Continue your journey", start: "Start learning free", profile: "Your account", existing: "Already have an account? Sign in", space: "Your English learning space", done: "The story has finished. Your introduction and learning options are now available.", running: "The story is playing. Your introduction will appear when it finishes.", fallback: "Learn English with AUNORA" },
} as const;
const features = [
  { Icon: BookOpen, id: "foundation", tag: { vi: "XÂY DỰNG NỀN TẢNG", en: "BUILD YOUR FOUNDATION" }, title: { vi: "Bắt đầu từ nền tảng", en: "Build your foundation" }, text: { vi: "Từ vựng và tình huống thực tế.", en: "Vocabulary for everyday situations." } },
  { Icon: MessageCircle, id: "voice", tag: { vi: "TỰ TIN CẤT LỜI", en: "FIND YOUR VOICE" }, title: { vi: "Tự tin cất lời", en: "Find your voice" }, text: { vi: "Luyện nói, từng cuộc trò chuyện.", en: "Practise speaking, one conversation at a time." } },
  { Icon: Sprout, id: "companion", tag: { vi: "NGƯỜI BẠN AI CỦA BẠN", en: "MEET YOUR AI COMPANION" }, title: { vi: "Có AI đồng hành", en: "An AI companion" }, text: { vi: "Hỏi điều chưa rõ, học theo cách riêng.", en: "Ask questions. Learn in your own way." } },
];

export default function HomeExperience({ signedIn }: { signedIn: boolean }) {
  const { language } = usePreferences();
  const t = copy[language];
  const [finished, setFinished] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const completedRef = useRef(false);
  const sendStart = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ type: "aunora:language", language }, window.location.origin);
    frameRef.current?.contentWindow?.postMessage({ type: completedRef.current ? "zenvora:garden-pause" : "zenvora:garden-start" }, window.location.origin);
  }, [language]);

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
  }, [sendStart]);

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

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label={`AUNORA — ${t.home}`}><span className={styles.mark} aria-hidden="true"><Sprout size={22} strokeWidth={1.3}/></span><span>AUNORA<small>LEARN · GROW · GLOW</small></span></Link>
      <nav className={styles.navigation} aria-label={t.nav}>
        <PreferenceControls/>
        <Link href={signedIn ? "/learn/profile" : "/login"} className={styles.login}>{signedIn ? t.account : t.login}</Link>
        <Link href={signedIn ? "/learn" : "/register"} className={styles.headerButton}>{signedIn ? t.learn : t.register}<ArrowRight size={15}/></Link>
      </nav>
    </header>
    <div className={styles.viewport}>
      <section ref={introRef} className={`${styles.intro} ${finished ? styles.introFinished : ""}`} aria-label={t.scene} aria-hidden={finished} inert={finished}>
        <div className={styles.story}><iframe ref={frameRef} onLoad={sendStart} src="/zenvora-garden/animation.html?intro=once" title={t.sceneTitle} className={styles.frame} loading="eager" referrerPolicy="same-origin"/></div>
        <button className={styles.skip} type="button" onClick={skip}>{t.skip} <ArrowRight size={13}/></button>
      </section>
      {finished ? <section className={styles.content} aria-labelledby="invitation-title">
        <div className={styles.invitation}>
          <p className={styles.eyebrow}><span aria-hidden="true"/> {t.eyebrow}</p>
          <h1 id="invitation-title" ref={headingRef} tabIndex={-1}>{t.heading}<br/><em>{t.accent}</em></h1>
          <p className={styles.lead}>{t.lead}<br/>{t.leadSecond}</p>
          <div className={styles.actions}><Link className={styles.primary} href={signedIn ? "/learn" : "/register"}>{signedIn ? t.continue : t.start}<ArrowRight size={17}/></Link><Link className={styles.secondary} href={signedIn ? "/learn/profile" : "/login"}>{signedIn ? t.profile : t.existing}</Link></div>
        </div>
        <div className={styles.features} aria-label={t.space}>{features.map(({Icon,id,tag,title,text},i)=><article key={id} className={styles.feature}><span className={styles.featureIcon}><Icon size={23} strokeWidth={1.5}/></span><div><span className={styles.featureTag}>{tag[language]}</span><h2>{title[language]}</h2><p>{text[language]}</p></div><span className={styles.featureNumber}>0{i+1}</span></article>)}</div>
      </section> : null}
    </div>
    <span className={styles.announcement} role="status">{finished ? t.done : t.running}</span>
    <noscript><div className={styles.noScript}><h1>{t.fallback}</h1><Link href="/register">{t.register}</Link><Link href="/login">{t.login}</Link></div></noscript>
  </main>;
}
