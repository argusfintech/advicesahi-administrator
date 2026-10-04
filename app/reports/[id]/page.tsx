"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type Section = {
  title: string; insurer: string | null; sub_type: string | null; status: string | null;
  sum_assured: number | null; premium_amount: number | null; grade: string | null;
  projected_irr: number | null; projected_maturity: number | null; guaranteed_maturity: number | null; projected_label: string | null;
  good: string[]; watch: string[]; basis: string | null; policy_id: string | null;
};

type Report = {
  id: string; headline: string | null; created_at: string; client_name: string | null;
  client: { phone: string | null; email: string | null; city: string | null } | null;
  policies: { id: string; insurer: string | null; plan_name: string | null; policy_number: string | null; sub_type: string | null; status: string | null; sum_assured: number | null; premium_amount: number | null }[];
  content: {
    verdict?: string; score?: number; band?: string;
    hlv?: { required?: number; in_force?: number; gap?: number; basis?: string };
    sections?: Section[];
  } | null;
};

const rupees = (n: number | null | undefined) => (n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`);
const pct = (n: number | null | undefined) => (n == null ? "—" : `${(n * 100).toFixed(2)}%`);

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    callAdmin<Report>({ action: "report_detail", report_id: id }).then(setR).catch((e) => setError(e.message));
  }, [id]);

  const c = r?.content;

  return (
    <RequireAdmin>
      {error && <p className="error">{error}</p>}
      {!r && !error && <p className="muted">Loading…</p>}
      {r && (
        <>
          <div className="split">
            <div>
              <h1>{r.client_name ?? "Client"}</h1>
              <p className="muted">Report created {fmtDate(r.created_at)}</p>
            </div>
            <div>
              <span className="muted">Phone </span>
              <span>{revealed ? r.client?.phone ?? "—" : r.client?.phone ? `••••••${r.client.phone.slice(-4)}` : "—"}</span>
              {r.client?.phone && <button className="btn secondary" style={{ marginLeft: 8, padding: "2px 8px" }} onClick={() => setRevealed(!revealed)}>{revealed ? "Hide" : "Show"}</button>}
            </div>
          </div>

          {c && (
            <div className="grid grid-2" style={{ marginTop: 16 }}>
              <div className="card">
                <div className="panel-title">Insurance score</div>
                <div className="stat-value">{c.score ?? "—"}</div>
                <div className="muted">{c.band ?? ""}</div>
                <p style={{ marginTop: 12 }}>{c.verdict ?? r.headline}</p>
              </div>
              <div className="card">
                <div className="panel-title">Life cover needed</div>
                <div className="row"><span>Required</span><span>{rupees(c.hlv?.required)}</span></div>
                <div className="row"><span>Cover in force</span><span>{rupees(c.hlv?.in_force)}</span></div>
                <div className="row"><span>Gap</span><span>{rupees(c.hlv?.gap)}</span></div>
                {c.hlv?.basis && <p className="muted" style={{ marginTop: 8 }}>{c.hlv.basis}</p>}
              </div>
            </div>
          )}

          <h2>Policies in this report</h2>
          {c?.sections && c.sections.length > 0 ? c.sections.map((s, i) => (
            <div className="card" key={s.policy_id ?? i} style={{ marginBottom: 12 }}>
              <div className="split">
                <div>
                  <div className="panel-title">{s.title}</div>
                  <div className="muted">{s.insurer ?? "—"} · {s.sub_type ?? "—"} · {s.status ?? "—"}</div>
                </div>
                {s.grade && <span className="tag">Grade {s.grade}</span>}
              </div>
              <div className="grid grid-3" style={{ marginTop: 12 }}>
                <div><div className="stat-label">Sum assured</div><div>{rupees(s.sum_assured)}</div></div>
                <div><div className="stat-label">Premium</div><div>{rupees(s.premium_amount)}</div></div>
                <div><div className="stat-label">Projected return</div><div>{pct(s.projected_irr)}</div></div>
              </div>
              <div className="grid grid-2" style={{ marginTop: 8 }}>
                <div><div className="stat-label">Maturity (Guaranteed)</div><div>{rupees(s.guaranteed_maturity)}</div></div>
                <div><div className="stat-label">Projected maturity</div><div>{rupees(s.projected_maturity)}</div></div>
              </div>
              {s.projected_label && <p className="muted">{s.projected_label}</p>}
              {s.good.length > 0 && <p style={{ color: "var(--good)", marginTop: 8 }}>{s.good.join(" ")}</p>}
              {s.watch.length > 0 && <p style={{ color: "var(--warn)" }}>{s.watch.join(" ")}</p>}
              {s.basis && <p className="muted">{s.basis}</p>}
            </div>
          )) : <p className="muted">This report has no policy sections.</p>}

          <h2>Policies held by this client ({r.policies.length})</h2>
          {r.policies.length === 0 ? <p className="muted">No policies on record.</p> : (
            <table>
              <thead><tr><th>Insurer</th><th>Plan</th><th>Type</th><th>Policy no.</th><th>Sum assured</th><th>Premium</th><th>Status</th></tr></thead>
              <tbody>
                {r.policies.map((p) => (
                  <tr key={p.id}>
                    <td>{p.insurer ?? "—"}</td><td>{p.plan_name ?? "—"}</td><td>{p.sub_type ?? "—"}</td>
                    <td>{revealed ? p.policy_number ?? "—" : p.policy_number ? `••••${p.policy_number.slice(-4)}` : "—"}</td>
                    <td>{rupees(p.sum_assured)}</td><td>{rupees(p.premium_amount)}</td><td>{p.status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p style={{ marginTop: 16 }}><Link href="/reports">← All reports</Link></p>
        </>
      )}
    </RequireAdmin>
  );
}
