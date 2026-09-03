import type { TicketRow } from "@/lib/database.types";

export type TicketState = "open" | "soft" | "hard";

export function ticketState(ticket: Pick<TicketRow, "status" | "resolution">): TicketState {
  if (ticket.status === "open") return "open";
  return ticket.resolution === "hard" ? "hard" : "soft";
}

const LABEL: Record<TicketState, string> = {
  open: "Needs you",
  soft: "Student resolved",
  hard: "You resolved",
};

const DOT_CLASS: Record<TicketState, string> = {
  open: "bg-maroon",
  soft: "bg-gold",
  hard: "bg-ink",
};

const TEXT_CLASS: Record<TicketState, string> = {
  open: "text-maroon-ink",
  soft: "text-gold-ink",
  hard: "text-ink-soft",
};

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
      className={`inline-block rounded-full shrink-0 ${dim} ${DOT_CLASS[state]}`}
      aria-hidden
    />
  );
}

const PRIORITY: Record<TicketState, number> = { open: 0, soft: 1, hard: 2 };

export function worstState(
  tickets: Pick<TicketRow, "status" | "resolution">[],
): TicketState | null {
  if (tickets.length === 0) return null;
  return tickets
    .map(ticketState)
    .sort((a, b) => PRIORITY[a] - PRIORITY[b])[0];
}

export function StateLabel({ state }: { state: TicketState }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${TEXT_CLASS[state]}`}>
      <StateDot state={state} size="sm" />
      {LABEL[state]}
    </span>
  );
}
