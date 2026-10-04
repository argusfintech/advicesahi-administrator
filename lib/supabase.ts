import { createClient } from "@supabase/supabase-js";

// Dedicated storage key so this app never collides with any other Supabase
// session stored in the same browser (see architecture notes in CLAUDE.md).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storageKey: "administrator-auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
