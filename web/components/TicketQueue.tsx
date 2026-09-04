"use client";

import Link from "next/link";
import { useMemo, useState, useId } from "react";
import type { TicketWithStudent } from "@/lib/data";
import {
  StateTag,
  ticketState,
  STATE_META,
  STATE_ORDER,
  type TicketState,
} from "@/components/StateDot";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";

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
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Fold diacritics so "Jagiellonski" finds "Jagielloński" and "Nguyen" finds
    "Nguyễn" — a caseload of ASU students is not ASCII, and an advisor
    shouldn't have to reproduce the marks to search. */
function fold(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

type Filter = TicketState | "all";

export function TicketQueue({
  tickets,
  showStudent = true,
  filterable = true,
}: {
  tickets: TicketWithStudent[];
  showStudent?: boolean;
  /** Off for short, already-scoped lists (a single student's tickets). */
  filterable?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const searchId = useId();

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: tickets.length, open: 0, soft: 0, hard: 0 };
    for (const t of tickets) c[ticketState(t)] += 1;
    return c;
  }, [tickets]);

  const visible = useMemo(() => {
    const q = fold(query.trim());
    return tickets.filter((t) => {
      if (filter !== "all" && ticketState(t) !== filter) return false;
      if (!q) return true;
      return [
        t.student?.profile.full_name,
        categoryLabel(t.category),
        t.ai_summary,
        t.escalation_reason,
      ]
        .filter(Boolean)
        .some((f) => fold(f!).includes(q));
    });
  }, [tickets, filter, query]);

  if (tickets.length === 0) {
    return <EmptyQueue />;
  }

  return (
    <div>
      {filterable && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div
            role="group"
            aria-label="Filter tickets by state"
            className="flex items-center gap-1 flex-wrap"
          >
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              count={counts.all}
            >
              All
            </FilterChip>
            {STATE_ORDER.map((s) => (
              <FilterChip
                key={s}
                active={filter === s}
                onClick={() => setFilter(s)}
                count={counts[s]}
                disabled={counts[s] === 0}
                dot={STATE_META[s].dot}
              >
                {STATE_META[s].label}
              </FilterChip>
            ))}
          </div>

          <div className="relative w-full sm:w-auto">
            <label htmlFor={searchId} className="sr-only">
              Search tickets
            </label>
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student, category, summary…"
              className="w-full sm:w-56 rounded-md border border-rule bg-paper-raised py-1.5 pl-8 pr-2.5 text-xs transition-colors duration-150 ease-out placeholder:text-ink-faint hover:border-rule-strong focus:border-maroon focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="border border-rule rounded-lg bg-paper-raised overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            No tickets match{" "}
            {query ? (
              <>
                &ldquo;<span className="font-medium">{query}</span>&rdquo;
              </>
            ) : (
              "this filter"
            )}
            .{" "}
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="underline decoration-rule-strong underline-offset-4 transition-colors duration-150 ease-out hover:decoration-ink"
            >
              Clear
            </button>
          </p>
        ) : (
          <ol className="divide-y divide-rule">
            {visible.map((t) => {
              const state = ticketState(t);
              return (
                <li key={t.id}>
                  <Link
                    href={`/tickets/${t.id}`}
                    className="group flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start gap-x-4 gap-y-1.5 px-4 py-2.5 transition-colors duration-150 ease-out hover:bg-rule/25 focus-visible:bg-rule/25 active:bg-rule/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {showStudent && (
                          <span className="font-medium text-sm leading-snug">
                            {t.student?.profile.full_name ?? "Unknown student"}
                          </span>
                        )}
                        <span className="text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                          {categoryLabel(t.category)}
                        </span>
                      </div>
                      <p className="text-sm text-ink-soft leading-snug mt-0.5 line-clamp-1">
                        {t.ai_summary ?? t.escalation_reason ?? "No summary yet."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 sm:pt-0.5">
                      <StateTag state={state} />
                      <span className="tabular text-[11px] text-ink-faint sm:w-16 text-right ml-auto sm:ml-0">
                        {relativeDate(t.created_at)}
                      </span>
                      <ChevronRightIcon className="text-ink-faint transition-colors duration-150 ease-out group-hover:text-ink" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {filterable && visible.length > 0 && (
        <p className="text-[11px] text-ink-faint mt-1.5 tabular">
          Showing {visible.length} of {tickets.length}
        </p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  count,
  dot,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  dot?: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors duration-150 ease-out active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${
        active
          ? "border-ink bg-ink text-paper-raised font-medium"
          : "border-rule text-ink-soft hover:border-rule-strong hover:text-ink"
      }`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dot} ${active ? "ring-1 ring-paper-raised" : ""}`}
          aria-hidden
        />
      )}
      {children}
      <span className="tabular opacity-70">{count}</span>
    </button>
  );
}

export function EmptyQueue() {
  return (
    <div className="border border-dashed border-rule-strong rounded-lg px-6 py-10 text-center">
      <p className="text-sm font-medium">Nothing in the queue.</p>
      <p className="text-sm text-ink-soft mt-1 max-w-sm mx-auto leading-snug">
        Vizor escalates here only when it can&rsquo;t resolve something on its
        own — an empty queue means it handled everything.
      </p>
    </div>
  );
}
