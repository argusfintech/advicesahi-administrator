"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type Report = { id: string; headline: string | null; content: unknown; created_at: string; consumer_user_id: string | null };

// The report content is rendered as the same structured data the client sees
// in the app, formatted for reading. Raw JSON is shown below for auditing.
export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callAdmin<Report>({ action: "report_detail", report_id: id }).then(setR).catch((e) => setError(e.message));
  }, [id]);

  return (
    <RequireAdmin>
      {error && <p className="error">{error}</p>}
      {!r && !error && <p className="muted">Loading…</p>}
      {r && (
        <>
          <h1>{r.headline ?? "Report"}</h1>
          <p className="muted">Created {fmtDate(r.created_at)}</p>
          <div className="card">
            <div className="panel-title">Report content</div>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, margin: 0 }}>{JSON.stringify(r.content, null, 2)}</pre>
          </div>
        </>
      )}
    </RequireAdmin>
  );
}
