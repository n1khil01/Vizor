import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * The ledger's running head: a fixed-height bar at the top of every content
 * column, holding where you are on the left and the counts that matter on
 * the right. It replaces the page-sized greeting block a dashboard doesn't
 * earn — an advisor triaging a queue needs the queue above the fold, not a
 * salutation.
 */
export function PageHeader({
  title,
  meta,
  backHref,
  backLabel,
  actions,
}: {
  title: ReactNode;
  meta?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-paper border-b border-rule">
      {backHref && (
        <div className="px-6 pt-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 -ml-1 rounded px-1 py-0.5 text-xs font-medium text-ink-faint transition-colors duration-150 ease-out hover:text-ink"
          >
            <ChevronLeftIcon />
            {backLabel ?? "Back"}
          </Link>
        </div>
      )}
      <div
        className={`px-6 flex items-end justify-between gap-6 flex-wrap ${
          backHref ? "pt-1 pb-3" : "py-4"
        }`}
      >
        <div className="min-w-0">
          <h1 className="font-serif text-2xl leading-tight truncate">{title}</h1>
          {meta && (
            <p className="text-xs text-ink-faint mt-1 leading-snug">{meta}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}

/** Small caps section marker used between blocks inside a page. */
export function SectionLabel({
  children,
  count,
}: {
  children: ReactNode;
  count?: number;
}) {
  return (
    <h2 className="flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
      {children}
      {count != null && (
        <span className="tabular font-normal text-ink-faint/80">{count}</span>
      )}
    </h2>
  );
}
