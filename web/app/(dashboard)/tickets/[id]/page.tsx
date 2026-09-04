import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTicket, getTicketMessages } from "@/lib/data";
import { StateLabel, ticketState } from "@/components/StateDot";
import { ResolveTicketButton } from "@/components/ResolveTicketButton";
import { ReplyForm } from "@/components/ReplyForm";
import { PageHeader, SectionLabel } from "@/components/PageHeader";

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
  const student = ticket.student;

  return (
    <>
      <PageHeader
        backHref="/tickets"
        backLabel="Tickets"
        title={student?.profile.full_name ?? "Unknown student"}
        meta={
          student ? (
            <>
              <Link
                href={`/students/${student.profile_id}`}
                className="underline decoration-rule-strong underline-offset-2 transition-colors duration-150 ease-out hover:decoration-ink"
              >
                {student.class_year ?? "—"} · {student.major ?? "Undeclared"}
              </Link>{" "}
              · Opened {formatDateTime(ticket.created_at)}
            </>
          ) : (
            <>Opened {formatDateTime(ticket.created_at)}</>
          )
        }
        actions={<StateLabel state={state} />}
      />

      <div className="px-6 py-5 max-w-3xl space-y-6">
        {/* The AI's context, first and side by side — product principle: an
            advisor should never have to re-ask what the student already told
            the bot. */}
        <section className="grid gap-3 sm:grid-cols-2">
          <ContextCard title="Why Vizor escalated this">
            {ticket.escalation_reason ?? "No reason recorded."}
          </ContextCard>
          <ContextCard title="Vizor's summary">
            {ticket.ai_summary ?? "No summary recorded."}
          </ContextCard>
        </section>

        <section>
          <SectionLabel count={messages.length}>Correspondence</SectionLabel>
          {messages.length === 0 ? (
            <p className="border border-dashed border-rule-strong rounded-lg px-4 py-6 text-center text-sm text-ink-soft">
              No correspondence yet — nothing has been sent to the student on
              this ticket.
            </p>
          ) : (
            <ol className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule overflow-hidden">
              {messages.map((m) => {
                const fromAdvisor = m.sender === "advisor";
                return (
                  <li
                    key={m.id}
                    className={`px-4 py-3 ${fromAdvisor ? "bg-paper-sunk/50" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                          fromAdvisor ? "text-ink" : "text-ink-faint"
                        }`}
                      >
                        {fromAdvisor ? "You" : student?.profile.full_name ?? "Student"}
                      </span>
                      <time
                        dateTime={m.created_at}
                        className="text-[11px] text-ink-faint tabular"
                      >
                        {formatDateTime(m.created_at)}
                      </time>
                    </div>
                    {m.subject && (
                      <p className="text-sm font-medium mb-0.5">{m.subject}</p>
                    )}
                    <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                      {m.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {ticket.status === "open" ? (
          <>
            <section>
              <SectionLabel>Reply</SectionLabel>
              <ReplyForm ticketId={ticket.id} />
            </section>

            <section className="border-t border-rule pt-5">
              <SectionLabel>Close this ticket</SectionLabel>
              <p className="text-sm text-ink-soft mb-3 max-w-prose leading-snug">
                Hard-resolving records this as closed by you — distinct from a
                student soft-resolving it themselves. Hold the button to
                commit; this can&rsquo;t be undone from here.
              </p>
              <ResolveTicketButton ticketId={ticket.id} />
            </section>
          </>
        ) : (
          <section className="border-t border-rule pt-5">
            <p className="text-sm text-ink-soft">
              {ticket.resolution === "hard"
                ? "Closed by you"
                : "Closed by the student"}
              {ticket.resolved_at && ` on ${formatDateTime(ticket.resolved_at)}`}.
            </p>
          </section>
        )}
      </div>
    </>
  );
}

function ContextCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-rule rounded-lg bg-paper-raised p-3.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1.5">
        {title}
      </h2>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
