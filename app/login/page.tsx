import { Suspense } from "react";
import AccountPanel from "../account-panel";

export default function LoginPage() {
  return <Suspense fallback={<main style={{ position: "fixed", inset: 0, background: "#061211" }} aria-label="Đang tải tài khoản"/>}><AccountPanel initialMode="login"/></Suspense>;
}
