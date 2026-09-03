import Link from "next/link";
import type { TicketWithStudent } from "@/lib/data";
import { StateDot, ticketState } from "@/components/StateDot";
import { ChevronRightIcon } from "@/components/icons";

const CATEGORY_LABEL: Record<string, string> = {
  major_change: "Major change",
  advisor_contact: "Advisor contact",
  dars_requirement: "DARS requirement",
  registration_hold: "Registration hold",
  records_request: "Records request",
};

function categoryLabel(category: string | null) {
  if (!category) return "General";
  return CATEGORY_LABEL[category] ?? category.replace(/_/g, " ");
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TicketQueue({
  tickets,
  showStudent = true,
}: {
  tickets: TicketWithStudent[];
  showStudent?: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <div className="border border-dashed border-rule-strong rounded-lg px-6 py-10 text-center">
        <p className="text-sm text-ink-soft">
          No tickets here. Vizor will escalate to this queue only when it
          can&rsquo;t resolve something on its own.
        </p>
      </div>
    );
  }

  return (
    <ol className="border border-rule rounded-lg overflow-hidden divide-y divide-rule bg-paper-raised">
      {tickets.map((t, i) => {
        const state = ticketState(t);
        return (
          <li key={t.id}>
            <Link
              href={`/tickets/${t.id}`}
              className="flex items-start gap-4 px-4 py-3.5 hover:bg-rule/25 transition-colors group"
            >
              <span className="tabular text-xs text-ink-faint pt-1 w-5 text-right shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <StateDot state={state} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  {showStudent && t.student && (
                    <span className="font-medium text-sm">
                      {t.student.profile.full_name}
                    </span>
                  )}
                  <span className="text-xs uppercase tracking-wide text-ink-faint">
                    {categoryLabel(t.category)}
                  </span>
                  <span className="text-xs text-ink-faint ml-auto tabular">
                    {relativeDate(t.created_at)}
                  </span>
                </div>
                <p className="text-sm text-ink-soft mt-0.5 line-clamp-1">
                  {t.ai_summary ?? t.escalation_reason ?? "No summary yet."}
                </p>
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-ink-faint shrink-0 mt-1.5 group-hover:text-ink-soft transition-colors">
                Review
                <ChevronRightIcon />
              </span>
              <ChevronRightIcon className="sm:hidden text-ink-faint shrink-0 mt-1.5 group-hover:text-ink-soft transition-colors" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
