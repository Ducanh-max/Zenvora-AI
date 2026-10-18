"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Camera, Check, Loader2, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setName(user.user_metadata?.display_name || user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPreview(user.user_metadata?.avatar_url || "");
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Hãy chọn tệp hình ảnh.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Ảnh gốc cần nhỏ hơn 8 MB.");
      return;
    }

    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
        reader.readAsDataURL(file);
      });

      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Không đọc được ảnh."));
        image.src = data;
      });

      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 320 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Trình duyệt không thể xử lý ảnh.");

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.65);

      if (compressed.length > 100000) {
        setError("Ảnh vẫn còn quá lớn, hãy chọn ảnh khác.");
        return;
      }

      setPreview(compressed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đọc tệp ảnh.");
    } finally {
      // Cho phép chọn lại cùng một tệp nếu cần.
      event.target.value = "";
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: name.trim(),
          full_name: name.trim(),
          avatar_url: preview || null,
        },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", user.id);

      if (profileError) {
        console.warn("Profile table update skipped:", profileError.message);
      }

      setMessage("Đã cập nhật hồ sơ của bạn.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu hồ sơ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="profile-page">
      <header className="profile-top">
        <Link href="/learn"><ArrowLeft size={17} />Về bảng điều khiển</Link>
        <b>AUNORA · HỒ SƠ CÁ NHÂN</b>
      </header>

      <section className="profile-card">
        <div className="eyebrow">TÀI KHOẢN CỦA BẠN</div>
        <h1>Chỉnh sửa hồ sơ</h1>
        <p className="profile-lead">Cập nhật tên hiển thị và ảnh đại diện của bạn.</p>

        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {preview ? <img src={preview} alt="Ảnh đại diện" /> : <UserRound size={42} />}
          </div>
          <button type="button" onClick={() => input.current?.click()}>
            <Camera size={16} /> Đổi ảnh đại diện
          </button>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={choose}
          />
        </div>

        <label htmlFor="profile-name">Tên hiển thị</label>
        <input
          id="profile-name"
          className="profile-input"
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nhập tên bạn muốn hiển thị"
        />

        <label htmlFor="profile-email">Email tài khoản</label>
        <input id="profile-email" className="profile-input" value={email} disabled />
        <p className="profile-help">Email được dùng để đăng nhập và không thể đổi tại đây.</p>

        {error && <div className="profile-error" role="alert">{error}</div>}
        {message && (
          <div className="profile-success" role="status">
            <Check size={16} />{message}
          </div>
        )}

        <button className="profile-save" onClick={save} disabled={busy || !name.trim()}>
          {busy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          Lưu thay đổi
        </button>
      </section>
    </main>
  );
}
