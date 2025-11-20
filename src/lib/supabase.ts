import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error("❌ Missing Supabase env vars.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper for SELECT * FROM table WHERE user_id = current_user
export const getUserId = async () => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user?.id || null;
};
