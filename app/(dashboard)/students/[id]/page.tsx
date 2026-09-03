import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAdvisorProfile,
  getAdvisorStudents,
  getAdvisorTickets,
  getStudentConversations,
  getStudentDarsReports,
} from "@/lib/data";
import { TicketQueue } from "@/components/TicketQueue";
import { ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Student — Vizor" };

export default async function StudentDetailPage({
  params,
}: PageProps<"/students/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const advisor = (await getAdvisorProfile(supabase, user!.id))!;

  const students = await getAdvisorStudents(supabase, advisor.id);
  const student = students.find((s) => s.profile_id === id);
  if (!student) notFound();

  const [tickets, conversations, reports] = await Promise.all([
    getAdvisorTickets(supabase, advisor.id),
    getStudentConversations(supabase, id),
    getStudentDarsReports(supabase, id),
  ]);

  const studentTickets = tickets.filter((t) => t.student_id === id);
  const latestReport = reports[0];

  return (
    <main className="px-8 py-8 max-w-4xl">
      <Link
        href="/students"
        className="text-sm text-ink-faint hover:text-ink-soft"
      >
        ← Students
      </Link>

      <header className="mt-4 mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl">{student.profile.full_name}</h1>
          <p className="text-ink-soft mt-1">
            {student.class_year} · {student.major} · {student.profile.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-faint uppercase tracking-wide">
            GPA
          </p>
          <p className="font-serif text-2xl tabular">
            {student.gpa != null ? student.gpa.toFixed(2) : "—"}
          </p>
        </div>
      </header>

      {latestReport && (
        <Link
          href={`/reports/${latestReport.id}`}
          className="block border border-rule rounded-lg bg-paper-raised p-4 mb-8 hover:border-rule-strong transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-1">
                Degree audit — {latestReport.program}
              </p>
              <p className="text-sm text-ink-soft">
                {latestReport.overall_status ?? "Status unavailable"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="tabular text-sm text-ink-faint">
                {latestReport.credits_earned ?? "—"}/
                {latestReport.credits_required ?? "—"} credits
              </span>
              <ChevronRightIcon className="text-ink-faint" />
            </div>
          </div>
        </Link>
      )}

      <section className="mb-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint mb-3">
          Tickets ({studentTickets.length})
        </h2>
        <TicketQueue tickets={studentTickets} showStudent={false} />
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint mb-3">
          Session history ({conversations.length})
        </h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-ink-faint">No chat sessions yet.</p>
        ) : (
          <ol className="border border-rule rounded-lg overflow-hidden divide-y divide-rule bg-paper-raised">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/sessions/${c.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-rule/25 transition-colors"
                >
                  <span className="text-sm">
                    Session started{" "}
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <ChevronRightIcon className="text-ink-faint" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
