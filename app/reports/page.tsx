"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type ReportRow = { id: string; headline: string | null; created_at: string; consumer_user_id: string | null };

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callAdmin<ReportRow[]>({ action: "reports_list" }).then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <RequireAdmin>
      <h1>Reports</h1>
      {error && <p className="error">{error}</p>}
      {!rows && !error && <p className="muted">Loading…</p>}
      {rows && (
        <table>
          <thead><tr><th>Report</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}><td><Link href={`/reports/${r.id}`}>{r.headline ?? "Report"}</Link></td><td>{fmtDate(r.created_at)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </RequireAdmin>
  );
}
