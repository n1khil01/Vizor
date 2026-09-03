import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getAdvisorProfile,
  getAdvisorConversations,
  getMessagesForConversations,
} from "@/lib/data";
import { ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Sessions — Vizor" };

function preview(text: string | null, max = 96) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const advisor = (await getAdvisorProfile(supabase, user!.id))!;

  const conversations = await getAdvisorConversations(supabase, advisor.id);
  const messagesByConv = await getMessagesForConversations(
    supabase,
    conversations.map((c) => c.id),
  );

  return (
    <main className="px-8 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">Session history</h1>
        <p className="text-ink-soft mt-1.5">
          Every chat Vizor has had with a student on your caseload.
        </p>
      </header>

      {conversations.length === 0 ? (
        <p className="text-sm text-ink-faint">No sessions yet.</p>
      ) : (
        <ol className="border border-rule rounded-lg overflow-hidden divide-y divide-rule bg-paper-raised">
          {conversations.map((c) => {
            const msgs = messagesByConv.get(c.id) ?? [];
            const firstUserMsg = msgs.find((m) => m.role === "user");
            return (
              <li key={c.id}>
                <Link
                  href={`/sessions/${c.id}`}
                  className="flex items-start gap-4 px-4 py-3.5 hover:bg-rule/25 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {c.student?.profile.full_name ?? "Unknown student"}
                      </span>
                      <span className="text-xs text-ink-faint tabular ml-auto">
                        {msgs.length} messages
                      </span>
                    </div>
                    <p className="text-sm text-ink-soft mt-0.5 line-clamp-1">
                      {preview(firstUserMsg?.content ?? null) ||
                        "No transcript captured."}
                    </p>
                  </div>
                  <ChevronRightIcon className="text-ink-faint shrink-0 mt-1.5 group-hover:text-ink-soft transition-colors" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
