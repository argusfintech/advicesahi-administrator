"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type AdvisorRow = {
  id: string; display_name: string; city: string | null; category: string;
  listing_status: string; irdai_license_no: string | null; arn_no: string | null;
  created_at: string;
  subscription: { tier: string; status: string; lead_topup_credits: number } | null;
};

export default function AdvisorsPage() {
  const [rows, setRows] = useState<AdvisorRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callAdmin<AdvisorRow[]>({ action: "advisors_list" }).then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <RequireAdmin>
      <h1>Advisors</h1>
      {error && <p className="error">{error}</p>}
      {!rows && !error && <p className="muted">Loading…</p>}
      {rows && (
        <table>
          <thead>
            <tr><th>Name</th><th>City</th><th>Category</th><th>Listing</th><th>Plan</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/advisors/${a.id}`}>{a.display_name}</Link></td>
                <td>{a.city ?? "—"}</td>
                <td>{a.category}</td>
                <td><span className={`tag ${a.listing_status === "live" ? "good" : ""}`}>{a.listing_status}</span></td>
                <td>{a.subscription ? `${a.subscription.tier} (${a.subscription.status})` : "None"}</td>
                <td>{fmtDate(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </RequireAdmin>
  );
}
