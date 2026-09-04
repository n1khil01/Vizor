import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getAdvisorProfile,
  getAdvisorConversations,
  getMessagesForConversations,
} from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Sessions — Vizor" };

function preview(text: string | null, max = 110) {
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
    <>
      <PageHeader
        title="Session history"
        meta={`Every chat Vizor has had with a student on your caseload · ${conversations.length} ${
          conversations.length === 1 ? "session" : "sessions"
        }`}
      />
      <div className="px-6 py-5 max-w-4xl">
        {conversations.length === 0 ? (
          <p className="border border-dashed border-rule-strong rounded-lg px-4 py-10 text-center text-sm text-ink-soft">
            No sessions yet. Transcripts appear here as students use the Vizor
            extension.
          </p>
        ) : (
          <ol className="border border-rule rounded-lg overflow-hidden divide-y divide-rule bg-paper-raised">
            {conversations.map((c) => {
              const msgs = messagesByConv.get(c.id) ?? [];
              const firstUserMsg = msgs.find((m) => m.role === "user");
              return (
                <li key={c.id}>
                  <Link
                    href={`/sessions/${c.id}`}
                    className="group flex items-start gap-4 px-4 py-2.5 transition-colors duration-150 ease-out hover:bg-rule/25"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm">
                          {c.student?.profile.full_name ?? "Unknown student"}
                        </span>
                        <time
                          dateTime={c.created_at}
                          className="text-[11px] text-ink-faint tabular"
                        >
                          {new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <p className="text-sm text-ink-soft leading-snug mt-0.5 line-clamp-1">
                        {preview(firstUserMsg?.content ?? null) ||
                          "No transcript captured."}
                      </p>
                    </div>
                    <span className="flex items-center gap-3 shrink-0 pt-0.5">
                      <span className="text-[11px] text-ink-faint tabular">
                        {msgs.length}
                        <span className="sr-only"> messages</span>
                        <span aria-hidden> msg</span>
                      </span>
                      <ChevronRightIcon className="text-ink-faint transition-colors duration-150 ease-out group-hover:text-ink" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
