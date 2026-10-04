"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type ClientRow = { key: string; name: string | null; phone: string | null; created_at: string; linked_advisor: string | null };

export default function ClientsPage() {
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      callAdmin<ClientRow[]>({ action: "clients_list", search: search.trim() || undefined })
        .then((r) => { setRows(r); setError(null); })
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <RequireAdmin>
      <h1>Clients</h1>
      <input placeholder="Search by name or phone" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360, marginBottom: 12 }} />
      {error && <p className="error">{error}</p>}
      {!rows && !error && <p className="muted">Loading…</p>}
      {rows && (
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Linked advisor</th><th>Date joined</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.key}>
                <td><Link href={`/clients/${c.key}`}>{c.name ?? "No name"}</Link></td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.linked_advisor ? <span className="tag good">{c.linked_advisor}</span> : <span className="tag">Not linked</span>}</td>
                <td>{fmtDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </RequireAdmin>
  );
}
