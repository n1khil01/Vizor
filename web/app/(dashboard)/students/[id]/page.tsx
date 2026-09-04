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
import { PageHeader, SectionLabel } from "@/components/PageHeader";
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
  const openCount = studentTickets.filter((t) => t.status === "open").length;
  const latestReport = reports[0];

  return (
    <>
      <PageHeader
        backHref="/students"
        backLabel="Students"
        title={student.profile.full_name}
        meta={
          <>
            {student.class_year ?? "—"} · {student.major ?? "Undeclared"} ·{" "}
            <a
              href={`mailto:${student.profile.email}`}
              className="underline decoration-rule-strong underline-offset-2 transition-colors duration-150 ease-out hover:decoration-ink"
            >
              {student.profile.email}
            </a>
          </>
        }
        actions={
          <dl className="flex items-start gap-5">
            <Figure label="GPA">
              {student.gpa != null ? student.gpa.toFixed(2) : "—"}
            </Figure>
            <Figure label="Open" emphasis={openCount > 0}>
              {openCount}
            </Figure>
          </dl>
        }
      />

      <div className="px-6 py-5 max-w-4xl space-y-6">
        {latestReport && (
          <section>
            <SectionLabel>Latest degree audit</SectionLabel>
            <Link
              href={`/reports/${latestReport.id}`}
              className="group flex items-center justify-between gap-3 border border-rule rounded-lg bg-paper-raised px-4 py-3 transition-colors duration-150 ease-out hover:border-rule-strong hover:bg-rule/15"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {latestReport.program}
                </p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {latestReport.overall_status ?? "Status unavailable"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="tabular text-xs text-ink-faint">
                  {latestReport.credits_earned ?? "—"}/
                  {latestReport.credits_required ?? "—"} cr
                </span>
                <ChevronRightIcon className="text-ink-faint transition-colors duration-150 ease-out group-hover:text-ink" />
              </div>
            </Link>
          </section>
        )}

        <section>
          <SectionLabel count={studentTickets.length}>Tickets</SectionLabel>
          <TicketQueue
            tickets={studentTickets}
            showStudent={false}
            filterable={studentTickets.length > 4}
          />
        </section>

        <section>
          <SectionLabel count={conversations.length}>
            Session history
          </SectionLabel>
          {conversations.length === 0 ? (
            <p className="border border-dashed border-rule-strong rounded-lg px-4 py-6 text-center text-sm text-ink-soft">
              No chat sessions yet — this student hasn&rsquo;t used the Vizor
              extension.
            </p>
          ) : (
            <ol className="border border-rule rounded-lg overflow-hidden divide-y divide-rule bg-paper-raised">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/sessions/${c.id}`}
                    className="group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-150 ease-out hover:bg-rule/25"
                  >
                    <span className="text-sm">
                      Session started{" "}
                      <time dateTime={c.created_at} className="tabular">
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </span>
                    <ChevronRightIcon className="text-ink-faint transition-colors duration-150 ease-out group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function Figure({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="text-right">
      <dt className="text-[10px] uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </dt>
      <dd
        className={`font-serif text-xl tabular leading-tight ${
          emphasis ? "text-maroon-ink" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
}
