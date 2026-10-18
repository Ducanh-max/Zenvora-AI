import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Chưa cấu hình Supabase. Hãy thêm URL và publishable key trong biến môi trường.");
  return createBrowserClient(url, key);
}
