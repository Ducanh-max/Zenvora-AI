"use client";

import { Users } from "lucide-react";
import { useOnlinePresence } from "@/app/online-presence-provider";
import styles from "./online-visitors.module.css";

export default function OnlineVisitors() {
  const { status, visitors } = useOnlinePresence();
  const live = status === "live";
  const label = live ? "Đang cập nhật trực tiếp" : status === "connecting" ? "Đang kết nối…" : "Kết nối bị gián đoạn — đang chờ kết nối lại";
  return <section className={styles.panel} aria-label="Truy cập trực tiếp">
    <header className={styles.heading}>
      <div><span className={styles.eyebrow}>TRUY CẬP TRỰC TIẾP</span><h3><Users size={20} aria-hidden="true" /> Đang online</h3></div>
      <span className={styles.status}><i className={live ? styles.live : styles.pending} />{label}</span>
    </header>
    <div className={styles.total} aria-live="polite"><strong>{live ? visitors.length : "—"}</strong><span>phiên truy cập đang kết nối</span></div>
    <p className={styles.description}>Tự ghi nhận khi vào web và cập nhật khi rời web. Mỗi tab là một phiên; không cần đăng nhập hoặc trả lời hộp hỏi thống kê.</p>
    {live && visitors.length > 0 ? <div className={styles.list}>
      {visitors.slice(0, 30).map((visitor) => <div className={styles.visitor} key={visitor.key}>
        <span><i className={styles.live} />Phiên {visitor.key.slice(0, 8)}</span>
        <time dateTime={visitor.connectedAt}>Kết nối lúc {new Date(visitor.connectedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}</time>
      </div>)}
      {visitors.length > 30 ? <p>Và {visitors.length - 30} phiên khác đang online.</p> : null}
    </div> : live ? <p className={styles.description}>Chưa có phiên đang kết nối.</p> : null}
    <small className={styles.note}>Đóng trang sẽ rời danh sách; mất mạng hoặc tắt máy đột ngột có thể cần một khoảng ngắn để máy chủ xác nhận offline. Chỉ dùng mã phiên tạm thời, không ghi tên hay email người xem.</small>
  </section>;
}
