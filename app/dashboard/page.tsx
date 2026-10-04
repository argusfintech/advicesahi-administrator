"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin } from "@/lib/api";

type Summary = {
  advisors_total: number; advisors_paid: number; advisors_ghost: number;
  clients_total: number; clients_matched: number; clients_unmatched: number;
  clients_with_policies: number; clients_without_policies: number;
  clients_with_report: number; clients_without_report: number;
  reports_total: number;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callAdmin<Summary>({ action: "summary" }).then(setS).catch((e) => setError(e.message));
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
              <div className="split">
                <div><div className="panel-title">Advisors</div></div>
              </div>
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
    </RequireAdmin>
  );
}
