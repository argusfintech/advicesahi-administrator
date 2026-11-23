"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { callAdmin, fmtDate } from "@/lib/api";

type AdvisorRow = {
  id: string; display_name: string; photo_signed_url: string | null; city: string | null; category: string;
  listing_status: string; irdai_license_no: string | null; arn_no: string | null;
  created_at: string;
  subscription: { tier: string; status: string; lead_topup_credits: number } | null;
};

function Avatar({ name, url, size = 28 }: { name: string; url: string | null; size?: number }) {
  const style = { width: size, height: size, borderRadius: "50%", flexShrink: 0 };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a local asset Next can optimize
    return <img src={url} alt={name} style={{ ...style, objectFit: "cover" as const }} />;
  }
  return (
    <span style={{
      ...style, display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "var(--navy)", color: "#fff", fontSize: size * 0.4, fontWeight: 600,
    }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

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
                <td>
                  <Link href={`/advisors/${a.id}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={a.display_name} url={a.photo_signed_url} />
                    {a.display_name}
                  </Link>
                </td>
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
