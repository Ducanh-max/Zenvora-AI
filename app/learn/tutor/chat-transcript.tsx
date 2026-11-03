"use client";

import { memo, useEffect, useRef } from "react";
import { User } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; imageData?: string };
type Props = { messages: Message[]; busy: boolean; profileAvatar: string | null; onAvatarError: () => void };

const ChatTranscript = memo(function ChatTranscript({ messages, busy, profileAvatar, onAvatarError }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chat = endRef.current?.parentElement;
    if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: "instant" });
  }, [messages, busy]);
  return <div className="at-chat-scroll">{messages.map((m,i)=><div key={i} className={"at-message "+m.role}><span className="at-avatar">{m.role==="assistant"?<img src="/_next/image?url=%2Fbrand%2Faivanta-mascot.webp.png&w=128&q=85" alt="Aivanta"/>:profileAvatar?<img src={profileAvatar} alt="Ảnh đại diện của bạn" referrerPolicy="no-referrer" onError={onAvatarError}/>:<User size={20}/>}</span><div className="at-message-main"><b>{m.role==="assistant"?"Aivanta – AI Tutor":"Bạn"}</b><div className="at-bubble">{m.imageData&&<img src={m.imageData} alt="Ảnh đính kèm" style={{maxWidth:"100%",maxHeight:240,display:"block",marginBottom:8,borderRadius:12}}/>}{m.content}</div></div></div>)}{busy&&<div className="at-message assistant"><span className="at-avatar">🐺</span><div className="at-bubble">Aivanta đang trả lời…</div></div>}<div ref={endRef}/></div>;
});
export default ChatTranscript;
