import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url =
    supabaseUrl && supabaseUrl !== "your-supabase-url"
      ? supabaseUrl
      : "https://placeholder.supabase.co";
  const key =
    supabaseKey && supabaseKey !== "your-supabase-anon-key"
      ? supabaseKey
      : "placeholder-key";

  return createBrowserClient(url, key);
}
