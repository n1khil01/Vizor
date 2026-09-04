import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getMyTicket, getTicketMessages } from "@/lib/data";

export const metadata = { title: "Ticket — Vizor" };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PortalTicketDetail({
  params,
}: PageProps<"/portal/tickets/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const student = await getStudentProfile(supabase, user.id);
  if (!student) redirect("/login/student?error=not-a-student");

  const ticket = await getMyTicket(supabase, student.profile_id, id);
  if (!ticket) notFound();

  const messages = await getTicketMessages(supabase, id);
  const inProgress = ticket.status === "open";

  return (
    <>
      <Link
        href="/portal"
        className="text-xs text-ink-faint hover:text-ink transition-colors duration-150 ease-out"
      >
        &larr; Your tickets
      </Link>

      <div className="flex items-center justify-between gap-3 mt-3 mb-6">
        <h1 className="font-serif text-2xl">
          {ticket.category ?? "Advising request"}
        </h1>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
            inProgress ? "bg-maroon/10 text-maroon-ink" : "bg-ink/5 text-ink-soft"
          }`}
        >
          {inProgress ? "In progress" : "Completed"}
        </span>
      </div>

      <section className="border border-rule rounded-lg bg-paper-raised p-3.5 mb-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1.5">
          Session summary
        </h2>
        <p className="text-sm leading-relaxed">
          {ticket.ai_summary ?? "No summary recorded."}
        </p>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
          Correspondence
        </h2>
        {messages.length === 0 ? (
          <p className="border border-dashed border-rule-strong rounded-lg px-4 py-6 text-center text-sm text-ink-soft">
            Nothing here yet.
          </p>
        ) : (
          <ol className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule overflow-hidden">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`px-4 py-3 ${m.sender === "advisor" ? "bg-paper-sunk/50" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    {m.sender === "advisor" ? "Your advisor" : "You"}
                  </span>
                  <time className="text-[11px] text-ink-faint tabular">
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
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
