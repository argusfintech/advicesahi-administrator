"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (pathname === "/login" || !signedIn) return null;

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <nav className="nav">
      <strong>AdviceSahi Administrator</strong>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/advisors">Advisors</Link>
      <Link href="/clients">Clients</Link>
      <Link href="/reports">Reports</Link>
      <button onClick={signOut}>Sign out</button>
    </nav>
  );
}
