"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type Summary = {
  advisors_total: number; advisors_paid: number; advisors_ghost: number;
  clients_total: number; clients_matched: number; clients_unmatched: number;
  clients_with_policies: number; clients_without_policies: number;
  clients_with_report: number; clients_without_report: number;
  reports_total: number;
};

type Ticket = {
  id: string; category: string; message: string; status: string; created_at: string;
  from_name: string; from_role: string;
};

type ImportIssue = {
  id: string; insurer: string | null; plan_name: string | null; policy_type: string | null;
  source: string | null; created_at: string; from_name: string;
};

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashboardPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [issues, setIssues] = useState<ImportIssue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callAdmin<Summary>({ action: "summary" }).then(setS).catch((e) => setError(e.message));
    callAdmin<Ticket[]>({ action: "tickets_list" }).then(setTickets).catch((e) => setError(e.message));
    callAdmin<ImportIssue[]>({ action: "policy_import_issues_list" }).then(setIssues).catch((e) => setError(e.message));
  }, []);

  return (
    <RequireAdmin>
      <h1>Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {!s && !error && <p className="muted">Loading…</p>}
      {s && (
        <>
          <div className="grid grid-2">
            <div className="card">
              <div className="panel-title">Advisors</div>
              <div className="grid grid-3" style={{ marginTop: 12 }}>
                <Stat label="Total advisors" value={s.advisors_total} href="/advisors" />
                <Stat label="Paid advisors" value={s.advisors_paid} />
                <Stat label="Ghost advisors" value={s.advisors_ghost} />
              </div>
              <p className="muted">Ghost: signed up more than 10 days ago and added no clients in their first 10 days.</p>
            </div>
            <div className="card">
              <div className="panel-title">Clients</div>
              <div className="grid grid-3" style={{ marginTop: 12 }}>
                <Stat label="Total clients" value={s.clients_total} href="/clients" />
                <Stat label="Matched" value={s.clients_matched} />
                <Stat label="Unmatched" value={s.clients_unmatched} />
                <Stat label="With policies" value={s.clients_with_policies} />
                <Stat label="Without policies" value={s.clients_without_policies} />
                <Stat label="With report" value={s.clients_with_report} />
                <Stat label="Without report" value={s.clients_without_report} />
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <Stat label="Total reports" value={s.reports_total} href="/reports" />
          </div>
        </>
      )}

      <h2>Support tickets</h2>
      {!tickets && !error && <p className="muted">Loading…</p>}
      {tickets && tickets.length === 0 && <p className="muted">No support tickets.</p>}
      {tickets && tickets.length > 0 && (
        <table>
          <thead><tr><th>From</th><th>Role</th><th>Category</th><th>Message</th><th>Status</th><th>Raised</th></tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.from_name}</td><td>{t.from_role}</td><td>{t.category}</td>
                <td>{t.message}</td><td>{t.status}</td><td>{fmtDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Policy import tickets</h2>
      {!issues && !error && <p className="muted">Loading…</p>}
      {issues && issues.length === 0 && <p className="muted">No policy import problems reported.</p>}
      {issues && issues.length > 0 && (
        <table>
          <thead><tr><th>From</th><th>Insurer</th><th>Plan</th><th>Type</th><th>Source</th><th>Reported</th></tr></thead>
          <tbody>
            {issues.map((i) => (
              <tr key={i.id}>
                <td>{i.from_name}</td><td>{i.insurer ?? "—"}</td><td>{i.plan_name ?? "—"}</td>
                <td>{i.policy_type ?? "—"}</td><td>{i.source ?? "—"}</td><td>{fmtDate(i.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </RequireAdmin>
  );
}
