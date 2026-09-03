import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversation, getConversationMessages } from "@/lib/data";

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

  return (
    <main className="px-8 py-8 max-w-3xl">
      <Link
        href="/sessions"
        className="text-sm text-ink-faint hover:text-ink-soft"
      >
        ← Sessions
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-serif text-3xl">
          {conversation.student?.profile.full_name ?? "Unknown student"}
        </h1>
        <p className="text-ink-soft mt-1 text-sm">
          Started{" "}
          {new Date(conversation.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </header>

      <ol className="space-y-3">
        {messages.map((m) => {
          if (m.role === "tool") {
            return (
              <li key={m.id} className="mr-10">
                <div className="border border-dashed border-rule-strong rounded-lg px-3 py-2 bg-paper">
                  <p className="text-[11px] uppercase tracking-wide text-ink-faint mb-1">
                    Vizor checked the record
                  </p>
                  <pre className="text-xs text-ink-soft overflow-x-auto whitespace-pre-wrap font-mono">
                    {toolSummary(m.tool_calls ?? m.content)}
                  </pre>
                </div>
              </li>
            );
          }
          if (!m.content) return null;
          const isStudent = m.role === "user";
          return (
            <li
              key={m.id}
              className={`border rounded-lg p-4 ${
                isStudent
                  ? "border-rule bg-paper-raised mr-10"
                  : "border-ink/20 bg-ink/[0.03] ml-10"
              }`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint mb-1.5">
                {isStudent ? conversation.student?.profile.full_name?.split(" ")[0] ?? "Student" : "Vizor"}
              </p>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                {m.content}
              </p>
            </li>
          );
        })}
        {messages.length === 0 && (
          <p className="text-sm text-ink-faint">No messages in this session.</p>
        )}
      </ol>
    </main>
  );
}
