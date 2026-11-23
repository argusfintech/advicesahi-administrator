"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type Incident = {
  id: string; summary: string; affected_table: string | null; affected_principal_count: number | null;
  status: "open" | "contained" | "closed"; board_notified_at: string | null; principals_notified_at: string | null;
  created_at: string;
};

// DPDP audit gap: "no breach-notification process exists." This is the
// record-keeping side only — it does not send anything. Logging an incident
// here, and marking when the Board and affected principals were told, is
// manual and deliberate: deciding what's reportable is a judgment call, not
// something to automate.
export default function IncidentsPage() {
  const [rows, setRows] = useState<Incident[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [table, setTable] = useState("");
  const [count, setCount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    callAdmin<Incident[]>({ action: "incidents_list" }).then(setRows).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const logIncident = async () => {
    if (!summary.trim()) return;
    setBusy(true);
    try {
      await callAdmin({
        action: "incident_log", summary: summary.trim(),
        affected_table: table.trim() || undefined,
        affected_principal_count: count ? Number(count) : undefined,
      });
      setSummary(""); setTable(""); setCount("");
      load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const mark = async (id: string, patch: { status?: Incident["status"]; board_notified?: boolean; principals_notified?: boolean }) => {
    setBusy(true);
    try { await callAdmin({ action: "incident_update", incident_id: id, ...patch }); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <RequireAdmin>
      <h1>Security incidents</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        A manual log, not an automated alert system. Logging an incident here does not notify anyone — that is a
        separate, deliberate step you take once you have decided what happened and who needs to know.
      </p>

      <div className="card">
        <div className="panel-title">Log a new incident</div>
        <label>What happened
          <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Describe what happened, when it was discovered, and the likely cause" />
        </label>
        <label>Affected table (optional)
          <input value={table} onChange={(e) => setTable(e.target.value)} placeholder="e.g. policies" />
        </label>
        <label>Affected people, approximate (optional)
          <input type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} />
        </label>
        <div className="actions">
          <button className="btn" disabled={busy || !summary.trim()} onClick={logIncident}>Log incident</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <h2>Logged incidents</h2>
      {!rows && !error && <p className="muted">Loading…</p>}
      {rows && rows.length === 0 && <p className="muted">None logged.</p>}
      {rows && rows.map((i) => (
        <div className="card" key={i.id} style={{ marginBottom: 12 }}>
          <div className="split">
            <div style={{ fontWeight: 600 }}>{i.summary}</div>
            <span className={`tag ${i.status === "closed" ? "good" : i.status === "contained" ? "warn" : "bad"}`}>{i.status}</span>
          </div>
          <div className="row"><span>Affected table</span><span>{i.affected_table ?? "—"}</span></div>
          <div className="row"><span>Affected people (approx.)</span><span>{i.affected_principal_count ?? "—"}</span></div>
          <div className="row"><span>Logged</span><span>{fmtDate(i.created_at)}</span></div>
          <div className="row"><span>Data Protection Board notified</span><span>{i.board_notified_at ? fmtDate(i.board_notified_at) : "Not yet"}</span></div>
          <div className="row"><span>Affected principals notified</span><span>{i.principals_notified_at ? fmtDate(i.principals_notified_at) : "Not yet"}</span></div>
          <div className="actions">
            {i.status !== "contained" && <button className="btn secondary" disabled={busy} onClick={() => mark(i.id, { status: "contained" })}>Mark contained</button>}
            {i.status !== "closed" && <button className="btn secondary" disabled={busy} onClick={() => mark(i.id, { status: "closed" })}>Mark closed</button>}
            {!i.board_notified_at && <button className="btn secondary" disabled={busy} onClick={() => mark(i.id, { board_notified: true })}>Mark Board notified</button>}
            {!i.principals_notified_at && <button className="btn secondary" disabled={busy} onClick={() => mark(i.id, { principals_notified: true })}>Mark principals notified</button>}
          </div>
        </div>
      ))}
    </RequireAdmin>
  );
}
