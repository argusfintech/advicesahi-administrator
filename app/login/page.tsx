"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Phone + password only. No OTP path exists here, and the server additionally
// refuses any session that was not created with a password.
export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const digits = phone.replace(/\D/g, "").slice(-10);
    const { error: authErr } = await supabase.auth.signInWithPassword({ phone: `+91${digits}`, password });
    setBusy(false);
    if (authErr) {
      setError("Sign-in failed. Check the number and password.");
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <div className="card form-narrow">
      <h1>Administrator sign-in</h1>
      <form onSubmit={submit}>
        <label>Mobile number
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="tel" required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </div>
      </form>
    </div>
  );
}
