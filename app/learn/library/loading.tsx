"use client";
import {useEffect,useState} from "react";
export default function Loading() {
  const [returning,setReturning]=useState(false);
  useEffect(()=>{try{setReturning(sessionStorage.getItem("aunora_returning_to_lesson")==="1")}catch{}},[]);
  return (
    <main className="quizpage aunora-quiz lesson-hub als-page" aria-busy="true" aria-live="polite">
      <style>{`
        .aunora-loading{min-height:65vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;text-align:center}
        .aunora-loading-card{width:min(100%,460px);padding:40px 24px;border-radius:28px;background:linear-gradient(150deg,#f4faff,#e9f2ff);border:1px solid #dbeafe;box-shadow:0 16px 48px rgba(40,91,164,.09)}
        .aunora-loading-wolf{width:110px;height:110px;object-fit:contain;animation:aunora-float 1.5s ease-in-out infinite}
        .aunora-loading-title{color:#163d72;font-size:24px;font-weight:800;margin:12px 0 8px}
        .aunora-loading-desc{color:#52739c;font-size:15px;margin:0 0 22px}
        .aunora-loading-track{height:10px;overflow:hidden;border-radius:999px;background:#cfe2fc}
        .aunora-loading-bar{height:100%;width:35%;border-radius:999px;background:linear-gradient(90deg,#60a5fa,#2563eb);animation:aunora-progress 1.25s ease-in-out infinite alternate}
        @keyframes aunora-progress{from{transform:translateX(0)}to{transform:translateX(190%)}}
        @keyframes aunora-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @media(prefers-reduced-motion:reduce){.aunora-loading-wolf,.aunora-loading-bar{animation:none}.aunora-loading-bar{width:65%}}
      `}</style>
      <section className="aunora-loading">
        <div className="aunora-loading-card" role="status">
          <img className="aunora-loading-wolf" src="/brand/wolf-face/aivanta-face.png" alt="" />
          <h1 className="aunora-loading-title">{returning?"Đang quay lại bài học...":"Đang vào khóa học..."}</h1>
          <p className="aunora-loading-desc">{returning?"Aivanta đang đưa bạn trở lại bài học vừa học":"Đang tải danh sách khóa học của bạn"}</p>
          <div className="aunora-loading-track" aria-hidden="true"><div className="aunora-loading-bar" /></div>
        </div>
      </section>
    </main>
  );
}
