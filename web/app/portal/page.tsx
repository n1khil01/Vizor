import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getMyTickets } from "@/lib/data";

export const metadata = { title: "My tickets — Vizor" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function PortalDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const student = await getStudentProfile(supabase, user.id);
  if (!student) redirect("/login/student?error=not-a-student");

  const tickets = await getMyTickets(supabase, student.profile_id);

  return (
    <>
      <h1 className="font-serif text-2xl mb-1">Your tickets</h1>
      <p className="text-sm text-ink-soft mb-7">
        Anything you or Vizor sent to {student.advisor_id ? "your advisor" : "an advisor"} shows up here.
      </p>

      {tickets.length === 0 ? (
        <p className="border border-dashed border-rule-strong rounded-lg px-4 py-8 text-center text-sm text-ink-soft">
          No tickets yet. Escalate a question to your advisor from the Vizor
          chat extension, or open one directly with the + button there.
        </p>
      ) : (
        <ol className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule overflow-hidden">
          {tickets.map((t) => {
            const inProgress = t.status === "open";
            return (
              <li key={t.id}>
                <Link
                  href={`/portal/tickets/${t.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 ease-out hover:bg-paper-sunk/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.category ?? "Advising request"}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      Opened {formatDate(t.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
                      inProgress
                        ? "bg-maroon/10 text-maroon-ink"
                        : "bg-ink/5 text-ink-soft"
                    }`}
                  >
                    {inProgress ? "In progress" : "Completed"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
