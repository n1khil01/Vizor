import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversation, getConversationMessages } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { firstName } from "@/lib/names";

export const metadata = { title: "Session — Vizor" };

function toolSummary(raw: unknown): string {
  if (raw == null) return "Checked something.";
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(raw);
  }
}

export default async function SessionDetailPage({
  params,
}: PageProps<"/sessions/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const conversation = await getConversation(supabase, id);
  if (!conversation) notFound();

  const messages = await getConversationMessages(supabase, id);
  const studentName = conversation.student?.profile.full_name ?? "Unknown student";

  return (
    <>
      <PageHeader
        backHref="/sessions"
        backLabel="Sessions"
        title={studentName}
        meta={
          <>
            Session started{" "}
            {new Date(conversation.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {messages.length} {messages.length === 1 ? "message" : "messages"}
          </>
        }
      />

      <div className="px-6 py-5 max-w-3xl">
        {messages.length === 0 ? (
          <p className="border border-dashed border-rule-strong rounded-lg px-4 py-10 text-center text-sm text-ink-soft">
            No messages in this session.
          </p>
        ) : (
          /* A transcript is a record, so it reads as one continuous ruled
             column with a speaker gutter — not as chat bubbles ping-ponging
             left and right. */
          <ol className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule overflow-hidden">
            {messages.map((m) => {
              if (m.role === "tool") {
                return (
                  <li key={m.id} className="bg-paper-sunk/60 px-4 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1">
                      Vizor checked the record
                    </p>
                    <pre className="text-[11px] text-ink-soft overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {toolSummary(m.tool_calls ?? m.content)}
                    </pre>
                  </li>
                );
              }
              if (!m.content) return null;
              const isStudent = m.role === "user";
              return (
                <li
                  key={m.id}
                  className="px-4 py-3 grid grid-cols-[5.5rem_1fr] gap-3 items-baseline"
                >
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em] truncate ${
                      isStudent ? "text-ink-faint" : "text-ink"
                    }`}
                  >
                    {isStudent ? firstName(studentName) : "Vizor"}
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-line min-w-0">
                    {m.content}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
