import Link from "next/link";
import type { StudentWithProfile, TicketWithStudent } from "@/lib/data";
import { StateDot, worstState } from "@/components/StateDot";

const LEGEND: { state: "open" | "soft" | "hard"; label: string; body: string }[] = [
  { state: "open", label: "Needs you", body: "Vizor couldn't resolve it alone." },
  { state: "soft", label: "Student resolved", body: "Closed by the student themselves." },
  { state: "hard", label: "You resolved", body: "A committed action, on record." },
];

export function RightRail({
  students,
  tickets,
}: {
  students: StudentWithProfile[];
  tickets: TicketWithStudent[];
}) {
  return (
    <aside className="hidden xl:flex w-72 shrink-0 border-l border-rule flex-col h-dvh sticky top-0 overflow-y-auto">
      <div className="px-6 pt-8 pb-6 border-b border-rule">
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-3">
          State key
        </h2>
        <ul className="space-y-3">
          {LEGEND.map((l) => (
            <li key={l.state} className="flex items-start gap-2.5">
              <StateDot state={l.state} />
              <div className="-mt-1">
                <p className="text-sm font-medium leading-tight">{l.label}</p>
                <p className="text-xs text-ink-faint mt-0.5 leading-snug">
                  {l.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-3">
          Caseload
        </h2>
        <ul className="space-y-1">
          {students.map((s) => {
            const theirs = tickets.filter((t) => t.student_id === s.profile_id);
            const state = worstState(theirs);
            return (
              <li key={s.profile_id}>
                <Link
                  href={`/students/${s.profile_id}`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 -mx-2 hover:bg-rule/25 transition-colors"
                >
                  {state ? (
                    <StateDot state={state} />
                  ) : (
                    <span className="w-2.5 h-2.5 shrink-0" />
                  )}
                  <span className="text-sm truncate">
                    {s.profile.full_name}
                  </span>
                  <span className="text-xs text-ink-faint ml-auto tabular shrink-0">
                    {theirs.filter((t) => t.status === "open").length || "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
