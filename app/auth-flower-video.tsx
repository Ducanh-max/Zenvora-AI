"use client";

export default function AuthFlowerVideo({ variant }: { variant: "login" | "register" }) {
  return <div style={{ width: "100%", height: "100%", minHeight: 0, overflow: "hidden" }} aria-hidden="true">
    <iframe src="/aunora-flower/index.html" title={variant === "login" ? "Bông hoa ánh sáng AUNORA — đăng nhập" : "Bông hoa ánh sáng AUNORA — đăng ký"} tabIndex={-1} loading="eager" style={{ display: "block", width: "100%", height: "100%", border: 0, pointerEvents: "none" }}/>
  </div>;
}
