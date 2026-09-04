import Link from "next/link";
import type { StudentWithProfile, TicketWithStudent } from "@/lib/data";
import { StateTag, worstState } from "@/components/StateDot";
import { ChevronRightIcon } from "@/components/icons";

/**
 * The caseload as a ledger table rather than a card grid: an advisor scans
 * down a column of GPAs and open counts, which a 3-up grid of cards makes
 * impossible. Scrolls horizontally on narrow viewports with the student name
 * pinned, instead of squeezing five columns into illegibility.
 */
export function CaseloadStrip({
  students,
  tickets,
}: {
  students: StudentWithProfile[];
  tickets: TicketWithStudent[];
}) {
  if (students.length === 0) {
    return (
      <div className="border border-dashed border-rule-strong rounded-lg px-6 py-10 text-center">
        <p className="text-sm font-medium">No students assigned yet.</p>
        <p className="text-sm text-ink-soft mt-1">
          Students appear here once they&rsquo;re routed to you in My ASU.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-rule rounded-lg bg-paper-raised overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm border-collapse">
        <caption className="sr-only">
          Your assigned students, with GPA and open ticket count
        </caption>
        <thead>
          <tr className="border-b border-rule text-left">
            <Th className="sticky left-0 bg-paper-raised">Student</Th>
            <Th>Year</Th>
            <Th>Program</Th>
            <Th align="right">GPA</Th>
            <Th align="right">Open</Th>
            <Th>State</Th>
            <Th srOnly>Open student</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {students.map((s) => {
            const theirs = tickets.filter((t) => t.student_id === s.profile_id);
            const openCount = theirs.filter((t) => t.status === "open").length;
            const state = worstState(theirs);

            return (
              <tr
                key={s.profile_id}
                className="group transition-colors duration-150 ease-out hover:bg-rule/25 focus-within:bg-rule/25"
              >
                <td className="sticky left-0 bg-paper-raised px-3 py-2 group-hover:bg-paper-hover transition-colors duration-150 ease-out">
                  <Link
                    href={`/students/${s.profile_id}`}
                    className="font-medium rounded-sm after:absolute after:inset-0 relative"
                  >
                    {s.profile.full_name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-soft whitespace-nowrap">
                  {s.class_year ?? "—"}
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {s.major ?? (
                    <span className="italic text-ink-faint">Undeclared</span>
                  )}
                </td>
                <td className="px-3 py-2 tabular text-right whitespace-nowrap">
                  {s.gpa != null ? (
                    s.gpa.toFixed(2)
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td
                  className={`px-3 py-2 tabular text-right whitespace-nowrap ${
                    openCount > 0 ? "font-medium text-maroon-ink" : "text-ink-faint"
                  }`}
                >
                  {openCount || "0"}
                </td>
                <td className="px-3 py-2">
                  {state ? (
                    <StateTag state={state} />
                  ) : (
                    <span className="text-xs text-ink-faint">No tickets</span>
                  )}
                </td>
                <td className="px-3 py-2 w-8">
                  <ChevronRightIcon className="text-ink-faint transition-colors duration-150 ease-out group-hover:text-ink" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = "left",
  className = "",
  srOnly,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  srOnly?: boolean;
}) {
  if (srOnly) {
    return (
      <th scope="col" className="sr-only">
        {children}
      </th>
    );
  }
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}
