"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  OverviewIcon,
  StudentsIcon,
  TicketsIcon,
  SessionsIcon,
  ReportsIcon,
  SignOutIcon,
} from "@/components/icons";
import { signOutAction } from "@/lib/actions";

const NAV = [
  { href: "/dashboard", label: "Overview", Icon: OverviewIcon },
  { href: "/tickets", label: "Tickets", Icon: TicketsIcon },
  { href: "/students", label: "Students", Icon: StudentsIcon },
  { href: "/sessions", label: "Sessions", Icon: SessionsIcon },
  { href: "/reports", label: "Reports", Icon: ReportsIcon },
] as const;

export function Sidebar({ advisorName }: { advisorName: string }) {
  const activeHref = usePathname();
  return (
    <aside className="w-16 sm:w-60 shrink-0 border-r border-rule bg-paper-raised flex flex-col h-dvh sticky top-0">
      <div className="px-3 sm:px-5 pt-6 pb-5 border-b border-rule">
        <Link
          href="/dashboard"
          className="flex items-baseline justify-center sm:justify-start gap-2"
        >
          <span className="font-sans font-bold text-lg tracking-tight">
            V
            <span className="hidden sm:inline">izor</span>
          </span>
          <span className="hidden sm:inline text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Advisor
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-2 sm:px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            activeHref === href || activeHref.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center justify-center sm:justify-start gap-3 rounded-md px-0 sm:px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-ink text-paper-raised font-medium"
                  : "text-ink-soft hover:bg-rule/40 hover:text-ink"
              }`}
            >
              <Icon
                className={
                  active
                    ? "text-paper-raised"
                    : "text-ink-faint group-hover:text-ink-soft"
                }
              />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-rule px-2 sm:px-3 py-3">
        <div className="flex items-center justify-center sm:justify-between gap-2 px-0 sm:px-2 py-1.5">
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-medium truncate">{advisorName}</p>
            <p className="text-xs text-ink-faint">Advisor</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 rounded-md text-ink-faint hover:text-maroon hover:bg-maroon/10 transition-colors"
            >
              <SignOutIcon />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
