import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorStudents, getAdvisorTickets } from "@/lib/data";
import { CaseloadStrip } from "@/components/CaseloadStrip";
import { TicketQueue } from "@/components/TicketQueue";
import { PageHeader, SectionLabel } from "@/components/PageHeader";
import { firstName } from "@/lib/names";

export const metadata = { title: "Overview — Vizor" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const advisor = (await getAdvisorProfile(supabase, user!.id))!;

  const [students, tickets] = await Promise.all([
    getAdvisorStudents(supabase, advisor.id),
    getAdvisorTickets(supabase, advisor.id),
  ]);

  const open = tickets.filter((t) => t.status === "open");

  return (
    <>
      <PageHeader
        title={`Good to see you, ${firstName(advisor.full_name)}.`}
        meta={
          <>
            {students.length} {students.length === 1 ? "student" : "students"}{" "}
            assigned ·{" "}
            <span className={open.length > 0 ? "text-maroon-ink font-medium" : ""}>
              {open.length} {open.length === 1 ? "ticket needs" : "tickets need"}{" "}
              you
            </span>
          </>
        }
      />

      <div className="px-6 py-5 space-y-6">
        <section>
          <SectionLabel count={students.length}>Caseload</SectionLabel>
          <CaseloadStrip students={students} tickets={tickets} />
        </section>

        <section>
          <SectionLabel count={tickets.length}>Ticket queue</SectionLabel>
          <TicketQueue tickets={tickets} />
        </section>
      </div>
    </>
  );
}
