"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PresenceSnapshot } from "@/lib/site-presence";

const initial: PresenceSnapshot = { status: "connecting", visitors: [] };
const PresenceContext = createContext<PresenceSnapshot>(initial);
const SESSION_KEY = "aunora.online-tab.v1";

export function useOnlinePresence() { return useContext(PresenceContext); }

export default function OnlinePresenceProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<PresenceSnapshot>(initial);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || window.location.hostname !== "zenvora-ai-alpha.vercel.app") return;
    let mounted = true;
    let pageActive = true;
    let client: SupabaseClient | undefined;
    let watch: typeof import("@/lib/site-presence").watchSitePresence | undefined;
    let stop: (() => void) | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    // Ephemeral tab identifier only: never publish account IDs, names or emails.
    let key: string = crypto.randomUUID();
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored && /^[0-9a-f-]{36}$/i.test(stored)) key = stored;
      else sessionStorage.setItem(SESSION_KEY, key);
    } catch { /* In-memory key is enough when browser storage is blocked. */ }

    const disconnect = () => { if (retry) clearTimeout(retry); retry = undefined; stop?.(); stop = undefined; };
    const connect = () => {
      if (!mounted || !pageActive || !client || !watch) return;
      disconnect();
      if (!navigator.onLine) { setSnapshot({ status: "offline", visitors: [] }); return; }
      stop = watch(client, key, (next) => {
        if (!mounted) return;
        setSnapshot(next);
        if (next.status === "live" && retry) { clearTimeout(retry); retry = undefined; }
        if (next.status === "unavailable" && !retry) {
          retry = setTimeout(() => { retry = undefined; connect(); }, 10000);
        }
      });
    };
    const hide = () => { pageActive = false; disconnect(); };
    const show = () => { pageActive = true; if (!stop) connect(); };
    const offline = () => { disconnect(); setSnapshot({ status: "offline", visitors: [] }); };
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);
    window.addEventListener("offline", offline);
    window.addEventListener("online", connect);
    void Promise.all([import("@/lib/supabase/client"), import("@/lib/site-presence")])
      .then(([browserClient, presence]) => {
        if (!mounted) return;
        client = browserClient.createClient();
        watch = presence.watchSitePresence;
        connect();
      }).catch(() => { if (mounted) setSnapshot({ status: "unavailable", visitors: [] }); });
    return () => {
      mounted = false;
      disconnect();
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", show);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", connect);
    };
  }, []);
  return <PresenceContext.Provider value={snapshot}>{children}</PresenceContext.Provider>;
}

