import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key-for-build-purposes";

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Supabase Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSupabaseServer() {
  // We dynamically import next/headers so it's not run/loaded on the client side
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    return supabase;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

