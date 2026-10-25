export const FLAG_KEYS = ["ai_tutor_enabled", "games_enabled", "feedback_enabled", "notifications_enabled"] as const;
export type FlagKey = typeof FLAG_KEYS[number];
export const FLAG_LABELS: Record<FlagKey, string> = { ai_tutor_enabled: "Gia sư AI", games_enabled: "Khu giải trí", feedback_enabled: "Báo lỗi và góp ý", notifications_enabled: "Thông báo khóa học" };
export function validLessonId(value: unknown): value is string { return typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value); }
export function safeLearnPath(value: unknown) { if(typeof value!=="string") return "/learn"; const p=value.split(/[?#]/)[0]; return /^\/learn(?:\/|$)/.test(p) && p.length<=200 ? p : "/learn"; }
export const POOR_LIMITS: Record<string, number> = { LCP: 4000, INP: 500, CLS: 0.25, TTFB: 1800, FCP: 3000 };
export function poorMetric(name: unknown, value: unknown) { return typeof name==="string" && name in POOR_LIMITS && typeof value==="number" && Number.isFinite(value) && value>POOR_LIMITS[name] && value<=600000; }
export function safePushEndpoint(value: unknown): value is string {
 if(typeof value!=="string" || value.length>2048) return false;
 try { const u=new URL(value); return u.protocol==="https:" && !u.username && !u.password && !u.hash && (!u.port || u.port==="443") && (u.hostname==="fcm.googleapis.com" || u.hostname==="updates.push.services.mozilla.com" || u.hostname==="web.push.apple.com" || u.hostname.endsWith(".notify.windows.com")); } catch { return false; }
}
export function validPushKeys(keys: unknown): keys is {p256dh:string;auth:string} {
 if(!keys || typeof keys!=="object") return false;
 const k=keys as Record<string,unknown>;
 return typeof k.p256dh==="string" && /^[A-Za-z0-9_-]{87}$/.test(k.p256dh) && typeof k.auth==="string" && /^[A-Za-z0-9_-]{22}$/.test(k.auth);
}
