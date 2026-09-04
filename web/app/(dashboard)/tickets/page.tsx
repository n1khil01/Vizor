import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorTickets } from "@/lib/data";
import { TicketQueue } from "@/components/TicketQueue";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Tickets — Vizor" };

export default async function TicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const advisor = (await getAdvisorProfile(supabase, user!.id))!;
  const tickets = await getAdvisorTickets(supabase, advisor.id);

  const open = tickets.filter((t) => t.status === "open").length;

  return (
    <>
      <PageHeader
        title="Tickets"
        meta={
          <>
            Everything Vizor couldn&rsquo;t close on its own ·{" "}
            <span className={open > 0 ? "text-maroon-ink font-medium" : ""}>
              {open} open
            </span>{" "}
            of {tickets.length}
          </>
        }
      />
      <div className="px-6 py-5">
        <TicketQueue tickets={tickets} />
      </div>
    </>
  );
}
