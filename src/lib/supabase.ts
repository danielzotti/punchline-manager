import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey) {
  console.warn("Supabase Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
