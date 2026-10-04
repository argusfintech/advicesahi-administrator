"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Client-side convenience only: it sends signed-out visitors to /login. Every
// data call is still refused by the server (admin-api), so this is not the
// security boundary.
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setReady(true);
    });
  }, [router]);

  if (!ready) return <p className="muted">Loading…</p>;
  return <>{children}</>;
}
