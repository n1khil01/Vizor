import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorDarsReports } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
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
    <>
      <PageHeader
        title="DARS reports"
        meta={`Degree audits behind every ticket — the ground truth Vizor reasons from · ${reports.length} on file`}
      />
      <div className="px-6 py-5 max-w-4xl">
        {reports.length === 0 ? (
          <p className="border border-dashed border-rule-strong rounded-lg px-4 py-10 text-center text-sm text-ink-soft">
            No DARS reports on file for your caseload.
          </p>
        ) : (
          <div className="border border-rule rounded-lg bg-paper-raised overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">
                Degree audit reports for your students
              </caption>
              <thead>
                <tr className="border-b border-rule text-left">
                  <Th>Student</Th>
                  <Th>Program</Th>
                  <Th>Status</Th>
                  <Th align="right">Credits</Th>
                  <th scope="col" className="sr-only">
                    Open report
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    className="group transition-colors duration-150 ease-out hover:bg-rule/25 focus-within:bg-rule/25"
                  >
                    <td className="px-3 py-2 font-medium">
                      <Link
                        href={`/reports/${r.id}`}
                        className="relative after:absolute after:inset-0"
                      >
                        {r.student?.profile.full_name ?? "Unknown student"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{r.program}</td>
                    <td className="px-3 py-2 text-ink-soft">
                      {r.overall_status ?? (
                        <span className="text-ink-faint">Unavailable</span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular text-right whitespace-nowrap">
                      {r.credits_earned ?? "—"}/{r.credits_required ?? "—"}
                    </td>
                    <td className="px-3 py-2 w-8">
                      <ChevronRightIcon className="text-ink-faint transition-colors duration-150 ease-out group-hover:text-ink" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
