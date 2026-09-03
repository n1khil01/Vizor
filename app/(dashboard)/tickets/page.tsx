import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorTickets } from "@/lib/data";
import { TicketQueue } from "@/components/TicketQueue";

export const metadata = { title: "Tickets — Vizor" };

export default async function TicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const advisor = (await getAdvisorProfile(supabase, user!.id))!;
  const tickets = await getAdvisorTickets(supabase, advisor.id);

  const open = tickets.filter((t) => t.status === "open");
  const resolved = tickets.filter((t) => t.status === "resolved");

  return (
    <main className="px-8 py-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">Tickets</h1>
        <p className="text-ink-soft mt-1.5">
          Everything Vizor couldn&rsquo;t close on its own, across your
          caseload.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint mb-3">
          Needs you ({open.length})
        </h2>
        <TicketQueue tickets={open} />
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint mb-3">
            Resolved ({resolved.length})
          </h2>
          <TicketQueue tickets={resolved} />
        </section>
      )}
    </main>
  );
}
