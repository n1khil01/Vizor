import Link from "next/link";
import type { StudentWithProfile, TicketWithStudent } from "@/lib/data";
import { StateDot, worstState } from "@/components/StateDot";

export function CaseloadStrip({
  students,
  tickets,
}: {
  students: StudentWithProfile[];
  tickets: TicketWithStudent[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((s) => {
        const theirs = tickets.filter((t) => t.student_id === s.profile_id);
        const openCount = theirs.filter((t) => t.status === "open").length;
        const state = worstState(theirs);

        return (
          <Link
            key={s.profile_id}
            href={`/students/${s.profile_id}`}
            className="border border-rule rounded-lg bg-paper-raised px-4 py-3.5 hover:border-rule-strong transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {s.profile.full_name}
                </p>
                <p className="text-xs text-ink-faint mt-0.5">
                  {s.class_year ?? "—"} · {s.major ?? "Undeclared"}
                </p>
              </div>
              {state && <StateDot state={state} />}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-ink-faint tabular">
                GPA {s.gpa != null ? s.gpa.toFixed(2) : "—"}
              </span>
              <span
                className={
                  openCount > 0
                    ? "text-maroon-ink font-medium"
                    : "text-ink-faint"
                }
              >
                {openCount > 0
                  ? `${openCount} open ${openCount === 1 ? "ticket" : "tickets"}`
                  : "No open tickets"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
