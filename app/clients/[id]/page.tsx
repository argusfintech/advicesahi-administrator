"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type Detail = {
  client: { id: string; full_name: string; phone: string | null; email: string | null; city: string | null; created_at: string; advisor_id: string | null; consumer_user_id: string | null };
  policies: { id: string; insurer: string | null; plan_name: string | null; policy_number: string | null; sub_type: string | null; status: string | null; sum_assured: number | null; premium_amount: number | null; created_at: string }[];
  reports: { id: string; headline: string | null; created_at: string }[];
  advisors_contacted: { id: string; status: string; created_at: string; current: boolean; advisor: { id: string; display_name: string; listing_status: string } | null }[];
  support_tickets: { id: string; category: string; message: string; status: string; created_at: string }[];
  policy_import_tickets: { id: string; insurer: string | null; plan_name: string | null; policy_type: string | null; source: string | null; created_at: string }[];
};

// Mask all but the last 4 digits by default — the full number is shown only
// because this admin page is already behind the server-audited admin-api.
const mask = (p: string | null) => (p ? `••••••${p.slice(-4)}` : "—");

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    callAdmin<Detail>({ action: "client_detail", client_id: id }).then(setD).catch((e) => setError(e.message));
  }, [id]);

  return (
    <RequireAdmin>
      {error && <p className="error">{error}</p>}
      {!d && !error && <p className="muted">Loading…</p>}
      {d && (
        <>
          <h1>{d.client.full_name}</h1>
          <div className="grid grid-2">
            <div className="card">
              <div className="panel-title">Details</div>
              <div className="row"><span>Phone</span><span>{revealed ? d.client.phone ?? "—" : mask(d.client.phone)}
                {d.client.phone && <button className="btn secondary" style={{ marginLeft: 8, padding: "2px 8px" }} onClick={() => setRevealed(!revealed)}>{revealed ? "Hide" : "Show"}</button>}
              </span></div>
              <div className="row"><span>Email</span><span>{d.client.email ?? "—"}</span></div>
              <div className="row"><span>City</span><span>{d.client.city ?? "—"}</span></div>
              <div className="row"><span>Date joined</span><span>{fmtDate(d.client.created_at)}</span></div>
            </div>

            <div className="card">
              <div className="panel-title">Advisors contacted</div>
              {d.advisors_contacted.length === 0 && <p className="muted">No advisor connections.</p>}
              {d.advisors_contacted.map((c) => (
                <div className="row" key={c.id}>
                  <span>
                    {c.advisor ? <Link href={`/advisors/${c.advisor.id}`}>{c.advisor.display_name}</Link> : "Unknown advisor"}
                    <span className="muted"> · {fmtDate(c.created_at)}</span>
                  </span>
                  <span className={`tag ${c.current ? "good" : ""}`}>{c.current ? "Current" : "Past"}</span>
                </div>
              ))}
            </div>
          </div>

          <h2>Reports ({d.reports.length})</h2>
          {d.reports.length === 0 ? <p className="muted">No reports.</p> : (
            <table>
              <thead><tr><th>Report</th><th>Created</th></tr></thead>
              <tbody>
                {d.reports.map((r) => (
                  <tr key={r.id}><td><Link href={`/reports/${r.id}`}>{r.headline ?? "Report"}</Link></td><td>{fmtDate(r.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Policies ({d.policies.length})</h2>
          {d.policies.length === 0 ? <p className="muted">No policies.</p> : (
            <table>
              <thead><tr><th>Insurer</th><th>Plan</th><th>Type</th><th>Policy no.</th><th>Sum assured</th><th>Premium</th><th>Status</th></tr></thead>
              <tbody>
                {d.policies.map((p) => (
                  <tr key={p.id}>
                    <td>{p.insurer ?? "—"}</td><td>{p.plan_name ?? "—"}</td><td>{p.sub_type ?? "—"}</td>
                    <td>{revealed ? p.policy_number ?? "—" : mask(p.policy_number)}</td>
                    <td>{p.sum_assured ? `₹${p.sum_assured.toLocaleString("en-IN")}` : "—"}</td>
                    <td>{p.premium_amount ? `₹${p.premium_amount.toLocaleString("en-IN")}` : "—"}</td>
                    <td>{p.status ?? "—"}</td>
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
                {d.support_tickets.map((t) => <tr key={t.id}><td>{t.category}</td><td>{t.message}</td><td>{t.status}</td><td>{fmtDate(t.created_at)}</td></tr>)}
              </tbody>
            </table>
          )}

          <h2>Policy import tickets</h2>
          {d.policy_import_tickets.length === 0 ? <p className="muted">None.</p> : (
            <table>
              <thead><tr><th>Insurer</th><th>Plan</th><th>Type</th><th>Source</th><th>Raised</th></tr></thead>
              <tbody>
                {d.policy_import_tickets.map((t) => <tr key={t.id}><td>{t.insurer ?? "—"}</td><td>{t.plan_name ?? "—"}</td><td>{t.policy_type ?? "—"}</td><td>{t.source ?? "—"}</td><td>{fmtDate(t.created_at)}</td></tr>)}
              </tbody>
            </table>
          )}
        </>
      )}
    </RequireAdmin>
  );
}
