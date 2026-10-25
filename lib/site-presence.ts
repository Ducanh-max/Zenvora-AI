import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export const SITE_PRESENCE_CHANNEL = "aunora:site-presence:v1";
export type OnlineVisitor = { key: string; connectedAt: string };
export type PresenceSnapshot = {
  status: "connecting" | "live" | "offline" | "unavailable";
  visitors: OnlineVisitor[];
};

export function visitorsFromState(state: Record<string, { online_at?: unknown }[]>): OnlineVisitor[] {
  return Object.entries(state).flatMap(([key, entries]) => {
    // A reconnect can temporarily have multiple metas for one tab: count it once.
    const times = entries.map((entry) => entry.online_at)
      .filter((time): time is string => typeof time === "string" && Number.isFinite(Date.parse(time)))
      .sort();
    return times.length ? [{ key, connectedAt: times[0] }] : [];
  }).sort((a, b) => a.connectedAt.localeCompare(b.connectedAt));
}

export function watchSitePresence(
  client: SupabaseClient,
  key: string,
  notify: (snapshot: PresenceSnapshot) => void,
) {
  let active = true;
  let subscribed = false;
  const onlineAt = new Date().toISOString();
  const channel: RealtimeChannel = client.channel(SITE_PRESENCE_CHANNEL, {
    config: { presence: { key } },
  });
  const sync = () => {
    if (!active || !subscribed) return;
    notify({ status: "live", visitors: visitorsFromState(channel.presenceState()) });
  };
  notify({ status: "connecting", visitors: [] });
  channel.on("presence", { event: "sync" }, sync).subscribe((status) => {
    if (!active) return;
    if (status === "SUBSCRIBED") {
      subscribed = true;
      // Supabase calls SUBSCRIBED again after reconnect; re-track the same tab.
      void channel.track({ online_at: onlineAt }).then((result) => {
        if (!active) return;
        if (result === "ok") sync();
        else notify({ status: "unavailable", visitors: [] });
      }).catch(() => { if (active) notify({ status: "unavailable", visitors: [] }); });
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      subscribed = false;
      // Do not present stale totals or a misleading zero during connection loss.
      notify({ status: "unavailable", visitors: [] });
    }
  });
  return () => {
    active = false;
    subscribed = false;
    // Leaving the channel releases presence. Abrupt disconnects are handled by
    // the Realtime server heartbeat timeout, rather than a browser timer.
    void client.removeChannel(channel).catch(() => {});
  };
}
