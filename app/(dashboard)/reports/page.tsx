import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorDarsReports } from "@/lib/data";
import { ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Reports — Vizor" };

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const advisor = (await getAdvisorProfile(supabase, user!.id))!;
  const reports = await getAdvisorDarsReports(supabase, advisor.id);

  return (
    <main className="px-8 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">DARS reports</h1>
        <p className="text-ink-soft mt-1.5">
          Degree audits behind every ticket &mdash; the ground truth Vizor
          reasons from.
        </p>
      </header>

      {reports.length === 0 ? (
        <p className="text-sm text-ink-faint">No DARS reports on file.</p>
      ) : (
        <ol className="border border-rule rounded-lg overflow-hidden divide-y divide-rule bg-paper-raised">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-rule/25 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    {r.student?.profile.full_name ?? "Unknown student"}
                  </p>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {r.program} · {r.overall_status ?? "Status unavailable"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tabular text-sm text-ink-faint">
                    {r.credits_earned ?? "—"}/{r.credits_required ?? "—"} cr
                  </span>
                  <ChevronRightIcon className="text-ink-faint group-hover:text-ink-soft transition-colors" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
