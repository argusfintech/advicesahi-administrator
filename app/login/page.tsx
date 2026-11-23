"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const OTP_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-otp`;

// OTP-only login (Twilio Verify, same provider the main app already uses on
// this Supabase project), founder's instruction 2026-11-10 — replacing the
// earlier phone+password design. admin-otp's own allowlist check
// (admin_users) + rate limits are the real gate: a code is only ever
// actually sent to a phone already in admin_users, and the response is
// identical either way so this can't be used to probe which numbers are
// admins.
//
// reCAPTCHA v3 (admin-login-captcha) was built and wired in here too, then
// paused per founder instruction, 2026-11-10 — removed from this page, but
// the edge function is still deployed and untouched if this needs to come
// back; re-adding it here is the only step required.
//
// The real completion (verifyOtp) still goes straight to Supabase Auth from
// the browser — admin-otp's "verify_gate" action only adds a tighter lockout
// (5 attempts/15 min) in front of that, same shape as the main app's own
// link-session otp_verify gate.
export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const e164 = () => `+91${phone.replace(/\D/g, "").slice(-10)}`;

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    await fetch(OTP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", phone: e164() }),
    }).catch(() => {});
    setBusy(false);
    setCodeSent(true);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const gateRes = await fetch(OTP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_gate", phone: e164() }),
    }).catch(() => null);
    const gate = await gateRes?.json().catch(() => ({ ok: false }));
    if (!gate?.ok) {
      setBusy(false);
      setError("Too many tries. Please wait 15 minutes.");
      return;
    }

    const { error: verifyErr } = await supabase.auth.verifyOtp({ phone: e164(), token: code, type: "sms" });
    setBusy(false);
    if (verifyErr) {
      setError("That code didn't match. Try again.");
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <div className="card form-narrow">
      <h1>Administrator sign-in</h1>
      {!codeSent ? (
        <form onSubmit={sendCode}>
          <label>Mobile number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="tel" required autoFocus />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <p>Code sent to {e164()}.</p>
          <label>6-digit code
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" required autoFocus />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button className="btn" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
