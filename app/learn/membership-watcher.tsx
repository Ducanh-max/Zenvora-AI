"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Plan = "free" | "explorer" | "achiever" | "mastery";
function normalized(value: unknown): Plan {
  if (value === "starter" || value === "explorer") return "explorer";
  if (value === "pro" || value === "achiever") return "achiever";
  if (value === "premium" || value === "mastery") return "mastery";
  return "free";
}
function dashboardPlan(pathname: string): Plan | null {
  if (pathname === "/learn" || pathname === "/learn/free") return "free";
  if (pathname === "/learn/explorer") return "explorer";
  if (pathname === "/learn/achiever") return "achiever";
  if (pathname === "/learn/mastery") return "mastery";
  return null;
}

export default function MembershipWatcher() {
  const pathname = usePathname();
  const currentPath = useRef(pathname);
  const requestCheck = useRef<(() => void) | null>(null);

  useEffect(() => {
    currentPath.current = pathname;
    requestCheck.current?.();
  }, [pathname]);

  useEffect(() => {
    const db = createClient();
    let alive = true;
    let busy = false;
    let queued = false;
    let known: Plan | null = null;
    let watchedUser = "";
    let channel: RealtimeChannel | undefined;
    let scheduled: ReturnType<typeof setTimeout> | undefined;

    const available = () => alive && document.visibilityState !== "hidden" && navigator.onLine !== false;
    const schedule = () => {
      if (!available()) return;
      if (scheduled) clearTimeout(scheduled);
      // Focus, visibility and realtime notifications often arrive together.
      scheduled = setTimeout(() => { scheduled = undefined; void check(); }, 120);
    };
    requestCheck.current = schedule;

    async function check() {
      if (!available()) return;
      if (busy) { queued = true; return; }
      busy = true;
      try {
        const { data: { user } } = await db.auth.getUser();
        if (!available() || !user) return;
        if (watchedUser !== user.id) {
          if (channel) void db.removeChannel(channel);
          watchedUser = user.id;
          known = null;
          channel = db.channel("membership-watch-" + user.id)
            .on("postgres_changes", {
              event: "*", schema: "public", table: "aunora_memberships",
              filter: "user_id=eq." + user.id,
            }, schedule).subscribe();
        }
        const { data, error } = await db.from("aunora_memberships")
          .select("plan,expires_at").eq("user_id", user.id).maybeSingle();
        if (!available() || error) return;
        const plan = data?.expires_at && new Date(data.expires_at).getTime() <= Date.now() ? "free" : normalized(data?.plan);
        const changed = known !== null && known !== plan;
        known = plan;
        const current = dashboardPlan(currentPath.current);
        if ((current !== null && current !== plan) || changed) {
          if (user.app_metadata?.role === "admin" && current !== null && current !== plan && !changed) return;
          window.location.replace(plan === "free" ? "/learn" : "/learn/" + plan);
        }
      } catch {
        // Keep the current page when a transient network failure prevents a check.
      } finally {
        busy = false;
        if (queued) { queued = false; schedule(); }
      }
    }

    void check();
    // Realtime handles upgrades promptly; polling also catches expiry/deletions.
    const timer = window.setInterval(schedule, 30000);
    window.addEventListener("focus", schedule);
    window.addEventListener("online", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      alive = false;
      requestCheck.current = null;
      window.clearInterval(timer);
      if (scheduled) clearTimeout(scheduled);
      window.removeEventListener("focus", schedule);
      window.removeEventListener("online", schedule);
      document.removeEventListener("visibilitychange", schedule);
      if (channel) void db.removeChannel(channel);
    };
  }, []);
  return null;
}
