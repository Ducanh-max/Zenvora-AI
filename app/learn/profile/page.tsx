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
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageBusy, setImageBusy] = useState(false);

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
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      const legacyAvatar = user.user_metadata?.avatar_url || "";
      setPreview(profile?.avatar_url || (legacyAvatar.startsWith("data:") ? "" : legacyAvatar));
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Dung lượng ảnh tối đa là 50 MB.");
      return;
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
        reader.readAsDataURL(file);
      });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Ảnh không hợp lệ."));
        img.src = url;
      });
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setEditingImage(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể mở ảnh.");
    }
  }

  async function applyCrop() {
    if (!editingImage) return;
    setImageBusy(true);
    setError("");
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Không thể xử lý ảnh."));
        image.src = editingImage;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Trình duyệt không hỗ trợ chỉnh sửa ảnh.");
      const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
      const maxX = (image.naturalWidth - size) / 2;
      const maxY = (image.naturalHeight - size) / 2;
      const x = maxX + (offsetX / 100) * maxX;
      const y = maxY + (offsetY / 100) * maxY;
      ctx.drawImage(image, x, y, size, size, 0, 0, 320, 320);
      setPreview(canvas.toDataURL("image/jpeg", 0.8));
      setEditingImage(null);
      setMessage("Ảnh đã được cắt. Nhấn Lưu thay đổi để cập nhật hồ sơ.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể cắt ảnh.");
    } finally {
      setImageBusy(false);
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
        },
      });
      if (authError) throw authError;

      let avatarUrl = preview;
      if (preview.startsWith("data:image/")) {
        const imageBlob = await fetch(preview).then((response) => {
          if (!response.ok) throw new Error("Không thể xử lý ảnh đại diện.");
          return response.blob();
        });
        const avatarPath = `${user.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(avatarPath, imageBlob, {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), avatar_url: avatarUrl || null })
        .eq("id", user.id);
      if (profileError) throw profileError;

      setPreview(avatarUrl);
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
            <Camera size={16} /> Đổi ảnh đại diện (tối đa 50 MB)
          </button>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={choose}
          />
        </div>

        {editingImage && (
          <div className="avatar-edit-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingImage(null); }}>
            <section className="avatar-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-edit-title">
              <h2 id="avatar-edit-title">Chỉnh ảnh đại diện</h2>
              <p>Di chuyển ảnh bằng thanh ngang, dọc và phóng to trước khi lưu.</p>
              <div className="avatar-edit-frame">
                <img src={editingImage} alt="Ảnh đang chỉnh sửa" style={{ transform: `translate(${-offsetX * (zoom - 1) / 2}%, ${-offsetY * (zoom - 1) / 2}%) scale(${zoom})` }} />
                <span className="avatar-edit-circle" />
              </div>
              <label>Phóng to: {zoom.toFixed(1)}×<input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
              <label>Di chuyển ngang<input type="range" min="-100" max="100" value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} /></label>
              <label>Di chuyển dọc<input type="range" min="-100" max="100" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} /></label>
              <div className="avatar-edit-actions">
                <button type="button" onClick={() => setEditingImage(null)}>Hủy</button>
                <button type="button" disabled={imageBusy} onClick={applyCrop}>{imageBusy ? "Đang xử lý..." : "Dùng ảnh này"}</button>
              </div>
            </section>
          </div>
        )}

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
      <style>{`\n.avatar-edit-overlay{position:fixed;inset:0;background:#08152cbd;display:grid;place-items:center;z-index:1000;padding:18px}.avatar-edit-dialog{background:#fff;color:#183054;width:min(420px,100%);max-height:95vh;overflow:auto;padding:24px;border-radius:22px;box-shadow:0 18px 65px #0005}.avatar-edit-dialog h2{margin:0 0 7px;font-size:22px}.avatar-edit-dialog p{font-size:13px;color:#64748b;line-height:1.5}.avatar-edit-frame{width:min(280px,75vw);height:min(280px,75vw);position:relative;overflow:hidden;margin:18px auto;background:#e6eef8;border-radius:50%;display:flex;align-items:center;justify-content:center}.avatar-edit-frame img{width:100%;height:100%;object-fit:cover;transform-origin:center}.avatar-edit-circle{position:absolute;inset:0;border:3px solid #4b94ff;border-radius:50%;pointer-events:none;box-shadow:inset 0 0 0 1px #fff8}.avatar-edit-dialog label{display:block;font-size:13px;font-weight:700;margin:13px 0}.avatar-edit-dialog input[type=range]{display:block;width:100%;margin-top:7px;accent-color:#2878ef}.avatar-edit-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.avatar-edit-actions button{border:1px solid #d8e2ef;background:#f3f6fb;color:#24416b;border-radius:10px;padding:11px 16px;cursor:pointer;font-weight:700}.avatar-edit-actions button:last-child{background:#2468e9;color:white;border-color:#2468e9}.avatar-edit-actions button:disabled{opacity:.6;cursor:wait}\n`}</style>
    </main>
  );
}
