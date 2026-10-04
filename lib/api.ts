import { supabase } from "./supabase";

const API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`;

export type AdminAction =
  | { action: "summary" }
  | { action: "advisors_list" }
  | { action: "advisor_detail"; advisor_id: string }
  | { action: "clients_list"; search?: string }
  | { action: "client_detail"; client_id: string }
  | { action: "reports_list" }
  | { action: "report_detail"; report_id: string }
  | { action: "tickets_list" }
  | { action: "policy_import_issues_list" }
  | { action: "subscription_assign"; advisor_id: string; tier: "starter" | "pro" | "elite"; reason: string }
  | { action: "subscription_cancel"; subscription_id: string; reason: string }
  | { action: "addon_set"; subscription_id: string; lead_topup_credits: number; reason: string };

/** Every admin call goes through the admin-api function, which re-checks
 *  the admin list and password-based sign-in on the server. */
export async function callAdmin<T = unknown>(body: AdminAction): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("SIGNED_OUT");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error("SIGNED_OUT");
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fmtDate(v: string | null | undefined): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
