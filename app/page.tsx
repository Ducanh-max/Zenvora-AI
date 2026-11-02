import { createClient } from "@/lib/supabase/server";
import HomeExperience from "./home-experience";

export default async function Home() {
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      signedIn = Boolean(user);
    } catch {
      // Keep the public introduction available during a temporary auth outage.
    }
  }
  return <HomeExperience signedIn={signedIn}/>;
}
