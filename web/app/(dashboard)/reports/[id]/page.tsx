import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDarsReportTree } from "@/lib/data";
import { RequirementTree } from "@/components/RequirementTree";
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
    <main className="px-8 py-8 max-w-3xl">
      <Link
        href="/reports"
        className="text-sm text-ink-faint hover:text-ink-soft"
      >
        ← Reports
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="font-serif text-3xl">
          {report.studentName ?? "Unknown student"}
        </h1>
        <p className="text-ink-soft mt-1">
          {report.program} · {report.college}
        </p>
      </header>

      <section className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall" value={report.overall_status ?? "—"} small />
        <Stat
          label="Credits"
          value={`${report.credits_earned ?? "—"}/${report.credits_required ?? "—"}`}
        />
        <Stat label="ASU GPA" value={report.asu_gpa?.toFixed(2) ?? "—"} />
        <Stat label="Major GPA" value={report.major_gpa?.toFixed(2) ?? "—"} />
      </section>

      <section>
        <div className="flex items-center gap-4 text-xs text-ink-faint mb-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-maroon inline-block" />
            Not satisfied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gold inline-block" />
            In progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ink inline-block" />
            Satisfied
          </span>
        </div>
        <RequirementTree nodes={tree} />
      </section>
    </main>
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
    <div className="border border-rule rounded-lg bg-paper-raised px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-ink-faint mb-0.5">
        {label}
      </p>
      <p className={`tabular ${small ? "text-xs leading-snug" : "text-lg font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
