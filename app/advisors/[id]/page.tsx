"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type Sub = { id: string; tier: string; status: string; lead_topup_credits: number; created_at: string };
type Detail = {
  advisor: {
    id: string; display_name: string; city: string | null; category: string; listing_status: string;
    irdai_license_no: string | null; arn_no: string | null; bio: string | null; phone: string | null; created_at: string;
  };
  subscriptions: Sub[];
  clients: { id: string; full_name: string; phone: string | null; created_at: string }[];
  support_tickets: { id: string; category: string; message: string; status: string; created_at: string }[];
};

export default function AdvisorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<"starter" | "pro" | "elite">("starter");
  const [reason, setReason] = useState("");
  const [credits, setCredits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    callAdmin<Detail>({ action: "advisor_detail", advisor_id: id }).then(setD).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError(null);
    try { await fn(); setReason(""); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const needReason = () => reason.trim().length < 5;

  return (
    <RequireAdmin>
      {error && <p className="error">{error}</p>}
      {!d && !error && <p className="muted">Loading…</p>}
      {d && (
        <>
          <h1>{d.advisor.display_name}</h1>
          <div className="grid grid-2">
            <div className="card">
              <div className="panel-title">Profile</div>
              <div className="row"><span>Phone</span><span>{d.advisor.phone ?? "—"}</span></div>
              <div className="row"><span>City</span><span>{d.advisor.city ?? "—"}</span></div>
              <div className="row"><span>Category</span><span>{d.advisor.category}</span></div>
              <div className="row"><span>IRDAI</span><span>{d.advisor.irdai_license_no ?? "—"}</span></div>
              <div className="row"><span>ARN</span><span>{d.advisor.arn_no ?? "—"}</span></div>
              <div className="row"><span>Listing</span><span>{d.advisor.listing_status}</span></div>
              <div className="row"><span>Joined</span><span>{fmtDate(d.advisor.created_at)}</span></div>
            </div>

            <div className="card">
              <div className="panel-title">Subscriptions</div>
              {d.subscriptions.length === 0 && <p className="muted">No subscription on record.</p>}
              {d.subscriptions.map((s) => (
                <div key={s.id} style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
                  <div className="row"><span>{s.tier}</span><span className={`tag ${s.status === "active" ? "good" : ""}`}>{s.status}</span></div>
                  <div className="row"><span>Add-on lead credits</span><span>{s.lead_topup_credits}</span></div>
                  {s.status === "active" && (
                    <div className="actions">
                      <input type="number" min={0} placeholder="Credits" value={credits[s.id] ?? ""}
                        onChange={(e) => setCredits({ ...credits, [s.id]: e.target.value })} style={{ width: 110 }} />
                      <button className="btn secondary" disabled={busy || needReason() || credits[s.id] === undefined || credits[s.id] === ""}
                        onClick={() => run(() => callAdmin({ action: "addon_set", subscription_id: s.id, lead_topup_credits: Number(credits[s.id]), reason }))}>
                        Set add-on credits
                      </button>
                      <button className="btn danger" disabled={busy || needReason()}
                        onClick={() => run(() => callAdmin({ action: "subscription_cancel", subscription_id: s.id, reason }))}>
                        Cancel subscription
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <div className="panel-title">Assign complimentary subscription</div>
                <label>Tier
                  <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
                    <option value="starter">Starter</option><option value="pro">Pro</option><option value="elite">Elite</option>
                  </select>
                </label>
              </div>
              <div className="actions" style={{ marginTop: 8 }}>
                <button className="btn" disabled={busy || needReason()}
                  onClick={() => run(() => callAdmin({ action: "subscription_assign", advisor_id: d.advisor.id, tier, reason }))}>
                  Assign complimentary
                </button>
              </div>
              <label>Reason (required for every change, at least 5 characters)
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
              </label>
            </div>
          </div>

          <h2>Clients ({d.clients.length})</h2>
          {d.clients.length === 0 ? <p className="muted">No clients yet.</p> : (
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Joined</th></tr></thead>
              <tbody>
                {d.clients.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/clients/client-${c.id}`}>{c.full_name}</Link></td>
                    <td>{c.phone ?? "—"}</td>
                    <td>{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Recent support tickets</h2>
          {d.support_tickets.length === 0 ? <p className="muted">None.</p> : (
            <table>
              <thead><tr><th>Category</th><th>Message</th><th>Status</th><th>Raised</th></tr></thead>
              <tbody>
                {d.support_tickets.map((t) => (
                  <tr key={t.id}><td>{t.category}</td><td>{t.message}</td><td>{t.status}</td><td>{fmtDate(t.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </RequireAdmin>
  );
}
