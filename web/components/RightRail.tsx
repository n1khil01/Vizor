import Link from "next/link";
import type { StudentWithProfile, TicketWithStudent } from "@/lib/data";
import { StateDot, STATE_META, STATE_ORDER, worstState } from "@/components/StateDot";

/**
 * Structural, not page content: the state key and the live caseload sit on
 * every dashboard route so the grammar is always legible and the advisor can
 * jump students without going back to a list.
 */
export function RightRail({
  students,
  tickets,
}: {
  students: StudentWithProfile[];
  tickets: TicketWithStudent[];
}) {
  const sorted = [...students].sort((a, b) => {
    const openOf = (s: StudentWithProfile) =>
      tickets.filter((t) => t.student_id === s.profile_id && t.status === "open")
        .length;
    return openOf(b) - openOf(a) || a.profile.full_name.localeCompare(b.profile.full_name);
  });

  return (
    <aside
      aria-label="State key and caseload"
      className="hidden xl:flex w-64 shrink-0 border-l border-rule bg-paper-raised flex-col h-dvh sticky top-0 overflow-y-auto"
    >
      <div className="px-4 py-4 border-b border-rule">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2.5">
          State key
        </h2>
        <ul className="space-y-2">
          {STATE_ORDER.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-1.5">
                <StateDot state={s} size="sm" />
              </span>
              <div>
                <p className="text-xs font-medium leading-tight">
                  {STATE_META[s].label}
                </p>
                <p className="text-[11px] text-ink-faint mt-0.5 leading-snug">
                  {STATE_META[s].blurb}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 py-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
          Caseload
        </h2>
        {sorted.length === 0 ? (
          <p className="text-xs text-ink-faint">No students assigned.</p>
        ) : (
          <ul className="-mx-2">
            {sorted.map((s) => {
              const theirs = tickets.filter((t) => t.student_id === s.profile_id);
              const open = theirs.filter((t) => t.status === "open").length;
              const state = worstState(theirs);
              return (
                <li key={s.profile_id}>
                  <Link
                    href={`/students/${s.profile_id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 ease-out hover:bg-rule/40"
                  >
                    {state ? (
                      <StateDot state={state} size="sm" />
                    ) : (
                      <span className="w-2 h-2 shrink-0" aria-hidden />
                    )}
                    <span className="text-xs truncate flex-1">
                      {s.profile.full_name}
                    </span>
                    <span
                      className={`text-[11px] tabular shrink-0 ${
                        open > 0 ? "text-maroon-ink font-medium" : "text-ink-faint"
                      }`}
                    >
                      {open > 0 ? open : "—"}
                      <span className="sr-only">
                        {open > 0 ? ` open tickets` : ` no open tickets`}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
