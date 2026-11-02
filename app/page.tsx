import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import styles from "./garden-home.module.css";

export default async function Home() {
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      signedIn = Boolean(user);
    } catch {
      // Keep the public introduction available during a temporary auth outage.
    }
  }
  const features = [
    { Icon: BookOpen, title: "Bắt đầu từ nền tảng", text: "Từ vựng, ngữ pháp và tình huống thực tế theo từng bước nhỏ.", href: "/courses", action: "Khám phá khóa học" },
    { Icon: MessageCircle, title: "Tự tin cất lời", text: "Dành thời gian luyện nói để tiếng Anh trở nên quen thuộc hơn.", href: "/learn/speaking", action: "Vào không gian luyện nói" },
    { Icon: Sprout, title: "Có AI đồng hành", text: "Hỏi điều chưa rõ, luyện hội thoại và tiếp tục hành trình của riêng bạn.", href: "/learn/tutor", action: "Gặp gia sư AI" },
  ];
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Zenvora — Trang chủ"><span className={styles.mark} aria-hidden="true"><Sprout size={23} strokeWidth={1.3}/></span><span>ZENVORA<small>YOUR ENGLISH TAKES ROOT</small></span></Link>
      <nav className={styles.navigation} aria-label="Điều hướng chính">
        <Link href="/courses" className={styles.coursesLink}>Khóa học</Link>
        <Link href={signedIn ? "/learn/profile" : "/login"} className={styles.login}>{signedIn ? "Tài khoản" : "Đăng nhập"}</Link>
        <Link href={signedIn ? "/learn" : "/register"} className={styles.headerButton}>{signedIn ? "Vào học" : "Đăng ký"}<ArrowRight size={15}/></Link>
      </nav>
    </header>
    <section className={styles.story} aria-label="Kỹ năng lớn lên từ những điều nhỏ">
      <iframe src="/zenvora-garden/animation.html" title="Hoạt cảnh khu vườn: cây rễ nông đổ trong mưa, cây được chăm sóc lớn lên với bộ rễ sâu" className={styles.frame} loading="eager" referrerPolicy="same-origin"/>
    </section>
    <section className={styles.invitation} aria-labelledby="invitation-title">
      <div><p className={styles.eyebrow}><span aria-hidden="true"/> A LITTLE PRACTICE. DEEPER ROOTS.</p><h1 id="invitation-title">Tiếng Anh vững vàng.<br className={styles.mobileBreak}/><em> Từ những điều nhỏ.</em></h1><p className={styles.lead}>Một bài học ngắn, một cuộc trò chuyện mới. Nuôi dưỡng sự tự tin của bạn mỗi ngày.</p></div>
      <div className={styles.actions}><Link className={styles.primary} href={signedIn ? "/learn" : "/register"}>{signedIn ? "Tiếp tục hành trình" : "Bắt đầu học miễn phí"}<ArrowRight size={17}/></Link><Link className={styles.secondary} href={signedIn ? "/learn/profile" : "/login"}>{signedIn ? "Tài khoản của bạn" : "Đã có tài khoản? Đăng nhập"}</Link></div>
    </section>
    <section className={styles.features} aria-label="Không gian học tiếng Anh">{features.map(({Icon,title,text,href,action},i)=><Link key={href} href={href} className={styles.feature}><Icon size={22} strokeWidth={1.25}/><span className={styles.featureNumber}>0{i+1}</span><h2>{title}</h2><p>{text}</p><span className={styles.featureLink}>{action}<ArrowRight size={14}/></span></Link>)}</section>
    <footer className={styles.footer}><Link href="/">ZENVORA</Link><span>Learn a little. Grow a little. Every day.</span><Link href="/about">Về chúng tôi</Link></footer>
  </main>;
}
