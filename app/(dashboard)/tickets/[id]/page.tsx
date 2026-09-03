import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTicket, getTicketMessages } from "@/lib/data";
import { StateLabel, ticketState } from "@/components/StateDot";
import { ResolveTicketButton } from "@/components/ResolveTicketButton";

export const metadata = { title: "Ticket — Vizor" };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function TicketDetailPage({
  params,
}: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const ticket = await getTicket(supabase, id);
  if (!ticket) notFound();

  const messages = await getTicketMessages(supabase, id);
  const state = ticketState(ticket);

  return (
    <main className="px-8 py-8 max-w-3xl">
      <Link
        href="/tickets"
        className="text-sm text-ink-faint hover:text-ink-soft"
      >
        ← Tickets
      </Link>

      <header className="mt-4 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <StateLabel state={state} />
          <span className="text-xs text-ink-faint tabular">
            Opened {formatDateTime(ticket.created_at)}
          </span>
        </div>
        <h1 className="font-serif text-3xl mt-2">
          {ticket.student?.profile.full_name ?? "Unknown student"}
        </h1>
        {ticket.student && (
          <p className="text-ink-soft text-sm mt-1">
            <Link
              href={`/students/${ticket.student.profile_id}`}
              className="underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
            >
              {ticket.student.class_year} · {ticket.student.major}
            </Link>
          </p>
        )}
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="border border-rule rounded-lg bg-paper-raised p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-2">
            Why Vizor escalated this
          </h2>
          <p className="text-sm leading-relaxed">
            {ticket.escalation_reason ?? "No reason recorded."}
          </p>
        </div>
        <div className="border border-rule rounded-lg bg-paper-raised p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-2">
            Vizor&rsquo;s summary
          </h2>
          <p className="text-sm leading-relaxed">
            {ticket.ai_summary ?? "No summary recorded."}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint mb-3">
          Correspondence
        </h2>
        <ol className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`border rounded-lg p-4 ${
                m.sender === "advisor"
                  ? "border-ink/20 bg-ink/[0.03] ml-6"
                  : "border-rule bg-paper-raised mr-6"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {m.sender === "advisor" ? "You" : "Student"}
                </span>
                <span className="text-xs text-ink-faint tabular">
                  {formatDateTime(m.created_at)}
                </span>
              </div>
              {m.subject && (
                <p className="text-sm font-medium mb-1">{m.subject}</p>
              )}
              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                {m.body}
              </p>
            </li>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-ink-faint">No messages yet.</p>
          )}
        </ol>
      </section>

      {ticket.status === "open" && (
        <section className="border-t border-rule pt-6">
          <p className="text-sm text-ink-soft mb-3 max-w-md">
            Hard-resolving records this as closed by you — distinct from a
            student soft-resolving it themselves. Hold the button to commit;
            this can&rsquo;t be undone from here.
          </p>
          <ResolveTicketButton ticketId={ticket.id} />
        </section>
      )}
    </main>
  );
}
