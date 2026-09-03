import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorStudents, getAdvisorTickets } from "@/lib/data";
import { CaseloadStrip } from "@/components/CaseloadStrip";
import { TicketQueue } from "@/components/TicketQueue";

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
  const firstName = advisor.full_name.split(" ").pop();

  return (
    <main className="px-8 py-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">
          Good to see you, {firstName}.
        </h1>
        <p className="text-ink-soft mt-1.5">
          {students.length} {students.length === 1 ? "student" : "students"}{" "}
          assigned ·{" "}
          <span className={open.length > 0 ? "text-maroon-ink font-medium" : ""}>
            {open.length} {open.length === 1 ? "ticket needs" : "tickets need"} you
          </span>
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint mb-3">
          Caseload
        </h2>
        <CaseloadStrip students={students} tickets={tickets} />
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint mb-3">
          Ticket queue
        </h2>
        <TicketQueue tickets={tickets} />
      </section>
    </main>
  );
}
