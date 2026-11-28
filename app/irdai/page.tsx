"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type IrdaiRow = {
  id: string; display_name: string; city: string | null; category: string;
  irdai_license_no: string; arn_no: string | null; verified: boolean;
  phone: string | null; license_doc_signed_url: string | null;
  created_at: string; updated_at: string;
};

const DEFAULT_NOTE = "IRDAI registration checked and verified";
const mask = (p: string | null) => (p ? `••••••${p.slice(-4)}` : "—");

// Advisors who entered an IRDAI number. Approving sets advisor_profiles.verified,
// which shows the verified badge on their public profile. Changing the number
// later resets them to unverified (DB trigger, migration 0098).
export default function IrdaiApprovalsPage() {
  const [rows, setRows] = useState<IrdaiRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const phone = (p: string | null) => (revealed ? (p ? `+${p}` : "—") : mask(p));

  const load = useCallback(() => {
    callAdmin<IrdaiRow[]>({ action: "irdai_list" }).then(setRows).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    const reason = (notes[id] ?? DEFAULT_NOTE).trim();
    if (reason.length < 5) { setError("Add a short note (at least 5 characters) before approving."); return; }
    setBusyId(id);
    setError(null);
    try { await callAdmin({ action: "irdai_approve", advisor_id: id, reason }); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusyId(null); }
  };

  const pending = rows?.filter((r) => !r.verified) ?? [];
  const verified = rows?.filter((r) => r.verified) ?? [];

  return (
    <RequireAdmin>
      <h1>IRDAI approvals</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Check each IRDAI registration number (and the uploaded licence, if any) before approving. Approving marks the
        advisor as verified. If they change the number later, they go back to pending.
      </p>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button className="btn secondary" onClick={() => setRevealed(!revealed)}>{revealed ? "Hide phone numbers" : "Show phone numbers"}</button>
      </div>
      {error && <p className="error">{error}</p>}
      {!rows && !error && <p className="muted">Loading…</p>}

      {rows && (
        <>
          <h2>Pending ({pending.length})</h2>
          {pending.length === 0 && <p className="muted">Nothing waiting.</p>}
          {pending.map((r) => (
            <div className="card" key={r.id} style={{ marginBottom: 12 }}>
              <div className="split">
                <Link href={`/advisors/${r.id}`} style={{ fontWeight: 600 }}>{r.display_name}</Link>
                <span className="tag warn">pending</span>
              </div>
              <div className="row"><span>IRDAI registration</span><span style={{ fontFamily: "monospace" }}>{r.irdai_license_no}</span></div>
              <div className="row"><span>ARN</span><span>{r.arn_no ?? "—"}</span></div>
              <div className="row"><span>Phone</span><span>{phone(r.phone)}</span></div>
              <div className="row"><span>City</span><span>{r.city ?? "—"}</span></div>
              <div className="row"><span>Licence document</span><span>
                {r.license_doc_signed_url
                  ? <a href={r.license_doc_signed_url} target="_blank" rel="noopener noreferrer">Open (link valid 15 min)</a>
                  : "Not uploaded"}
              </span></div>
              <div className="row"><span>Last updated</span><span>{fmtDate(r.updated_at)}</span></div>
              <label>Note for the audit log
                <input value={notes[r.id] ?? DEFAULT_NOTE} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
              </label>
              <div className="actions">
                <button className="btn" disabled={busyId !== null} onClick={() => approve(r.id)}>
                  {busyId === r.id ? "Approving…" : "Approve"}
                </button>
              </div>
            </div>
          ))}

          <h2>Verified ({verified.length})</h2>
          {verified.length === 0 && <p className="muted">None yet.</p>}
          {verified.length > 0 && (
            <table>
              <thead><tr><th>Advisor</th><th>IRDAI registration</th><th>Phone</th><th>City</th></tr></thead>
              <tbody>
                {verified.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/advisors/${r.id}`}>{r.display_name}</Link></td>
                    <td style={{ fontFamily: "monospace" }}>{r.irdai_license_no}</td>
                    <td>{phone(r.phone)}</td>
                    <td>{r.city ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </RequireAdmin>
  );
}
