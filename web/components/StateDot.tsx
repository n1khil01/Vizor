import type { TicketRow } from "@/lib/database.types";

/**
 * The three-state grammar, defined exactly once.
 *
 * A ticket's status and a DARS requirement's status are the same kind of
 * fact — does this need the advisor, did the student settle it, or did the
 * advisor commit a resolution — so they share one vocabulary. Every surface
 * that shows status reads from STATE_META below. Nothing anywhere else in
 * the app is allowed to hard-code maroon, gold, or ink for status.
 *
 * Colour never carries the meaning on its own: `StateTag` always renders the
 * label, and `StateDot` is aria-hidden decoration beside real text.
 */

export type TicketState = "open" | "soft" | "hard";

export const STATE_META: Record<
  TicketState,
  {
    /** Ticket-side wording. */
    label: string;
    /** DARS-side wording for the same underlying state. */
    darsLabel: string;
    blurb: string;
    /** The filled mark. Gold uses its -mark token; #ffc627 is invisible here. */
    dot: string;
    /** Text tone, all >= 4.5:1 on paper. */
    text: string;
    /** Large flooded fill + the text tone that survives on it. */
    band: string;
    bandText: string;
  }
> = {
  open: {
    label: "Needs you",
    darsLabel: "Not satisfied",
    blurb: "Vizor couldn't resolve it alone.",
    dot: "bg-maroon",
    text: "text-maroon-ink",
    band: "bg-maroon",
    bandText: "text-paper-raised",
  },
  soft: {
    label: "Student resolved",
    darsLabel: "In progress",
    blurb: "Closed by the student themselves.",
    dot: "bg-gold-mark",
    text: "text-gold-ink",
    band: "bg-gold",
    bandText: "text-ink",
  },
  hard: {
    label: "You resolved",
    darsLabel: "Satisfied",
    blurb: "A committed action, on record.",
    dot: "bg-ink",
    text: "text-ink-soft",
    band: "bg-ink",
    bandText: "text-paper-raised",
  },
};

export const STATE_ORDER: TicketState[] = ["open", "soft", "hard"];

export function ticketState(
  ticket: Pick<TicketRow, "status" | "resolution">,
): TicketState {
  if (ticket.status === "open") return "open";
  return ticket.resolution === "hard" ? "hard" : "soft";
}

/** DARS statuses map onto the same three states. `informational` has none. */
export function darsState(status: string): TicketState | null {
  if (status === "not_satisfied") return "open";
  if (status === "in_progress") return "soft";
  if (status === "satisfied") return "hard";
  return null;
}

const PRIORITY: Record<TicketState, number> = { open: 0, soft: 1, hard: 2 };

export function worstState(
  tickets: Pick<TicketRow, "status" | "resolution">[],
): TicketState | null {
  if (tickets.length === 0) return null;
  return tickets.map(ticketState).sort((a, b) => PRIORITY[a] - PRIORITY[b])[0];
}

/**
 * The mark on its own. Decoration: it is always accompanied by text, so it
 * is hidden from assistive tech rather than given a redundant label.
 */
export function StateDot({
  state,
  size = "md",
}: {
  state: TicketState;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${dim} ${STATE_META[state].dot}`}
      aria-hidden
    />
  );
}

/**
 * Mark + label. The only way status is allowed to appear in a list or table,
 * so that status is never conveyed by colour alone.
 */
export function StateTag({
  state,
  vocabulary = "ticket",
  className = "",
}: {
  state: TicketState;
  vocabulary?: "ticket" | "dars";
  className?: string;
}) {
  const meta = STATE_META[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${meta.text} ${className}`}
    >
      <StateDot state={state} size="sm" />
      {vocabulary === "dars" ? meta.darsLabel : meta.label}
    </span>
  );
}

/** The same pair at body size, for a detail page's header. */
export function StateLabel({ state }: { state: TicketState }) {
  const meta = STATE_META[state];
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${meta.text}`}
    >
      <StateDot state={state} />
      {meta.label}
    </span>
  );
}
