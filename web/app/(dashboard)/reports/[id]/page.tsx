import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDarsReportTree } from "@/lib/data";
import { RequirementTree } from "@/components/RequirementTree";
import { PageHeader, SectionLabel } from "@/components/PageHeader";
import { StateDot, STATE_META, STATE_ORDER } from "@/components/StateDot";
import type { DarsReportRow } from "@/lib/database.types";

export const metadata = { title: "Degree audit — Vizor" };

async function getReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<(DarsReportRow & { studentName: string | null }) | null> {
  const { data: report } = await supabase
    .from("dars_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!report) return null;

  const { data: student } = await supabase
    .from("students")
    .select("profile_id")
    .eq("profile_id", report.student_id)
    .maybeSingle();

  let studentName: string | null = null;
  if (student) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", student.profile_id)
      .maybeSingle();
    studentName = profile?.full_name ?? null;
  }

  return { ...report, studentName };
}

export default async function ReportDetailPage({
  params,
}: PageProps<"/reports/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const report = await getReport(supabase, id);
  if (!report) notFound();

  const tree = await getDarsReportTree(supabase, id);

  return (
    <>
      <PageHeader
        backHref="/reports"
        backLabel="Reports"
        title={report.studentName ?? "Unknown student"}
        meta={
          <>
            {report.program}
            {report.college && ` · ${report.college}`}
            {report.catalog_year && ` · Catalog ${report.catalog_year}`}
          </>
        }
      />

      <div className="px-6 py-5 max-w-3xl space-y-5">
        <section>
          <SectionLabel>Audit summary</SectionLabel>
          <dl className="grid grid-cols-2 sm:grid-cols-4 border border-rule rounded-lg bg-paper-raised divide-x divide-y sm:divide-y-0 divide-rule overflow-hidden">
            <Stat label="Overall" value={report.overall_status ?? "—"} small />
            <Stat
              label="Credits"
              value={`${report.credits_earned ?? "—"}/${report.credits_required ?? "—"}`}
            />
            <Stat label="ASU GPA" value={report.asu_gpa?.toFixed(2) ?? "—"} />
            <Stat label="Major GPA" value={report.major_gpa?.toFixed(2) ?? "—"} />
          </dl>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
            <SectionLabel>Requirements</SectionLabel>
            {/* Reads from the shared grammar rather than re-declaring the
                colours — same three states as the ticket queue. */}
            <ul className="flex items-center gap-3 text-[11px] text-ink-faint mb-2">
              {STATE_ORDER.map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <StateDot state={s} size="sm" />
                  {STATE_META[s].darsLabel}
                </li>
              ))}
            </ul>
          </div>
          <RequirementTree nodes={tree} />
        </section>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.08em] text-ink-faint mb-0.5">
        {label}
      </dt>
      <dd
        className={`tabular ${small ? "text-xs leading-snug" : "text-lg font-medium leading-tight"}`}
      >
        {value}
      </dd>
    </div>
  );
}
