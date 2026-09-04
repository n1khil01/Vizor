"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
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

function initials(name: string) {
  const parts = name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i, "").split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export function Sidebar({ advisorName }: { advisorName: string }) {
  const activeHref = usePathname();
  return (
    <aside className="w-14 sm:w-56 shrink-0 border-r border-rule bg-paper-raised flex flex-col h-dvh sticky top-0">
      <div className="h-14 flex items-center px-3 sm:px-4 border-b border-rule">
        <Link
          href="/dashboard"
          className="flex items-baseline justify-center sm:justify-start gap-1.5 w-full rounded-sm"
        >
          <span className="font-sans font-bold text-base tracking-tight">
            V<span className="hidden sm:inline">izor</span>
          </span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Advisor
          </span>
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-2 py-2 flex flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            activeHref === href || activeHref.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center justify-center sm:justify-start gap-2.5 rounded-md px-0 sm:px-2.5 py-2 text-sm transition-colors duration-150 ease-out active:scale-[0.99] ${
                active
                  ? "bg-ink text-paper-raised font-medium"
                  : "text-ink-soft hover:bg-rule/45 hover:text-ink"
              }`}
            >
              <Icon
                className={
                  active
                    ? "text-paper-raised"
                    : "text-ink-faint group-hover:text-ink-soft transition-colors duration-150 ease-out"
                }
              />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-rule p-2">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 shrink-0 rounded-full bg-ink text-paper-raised grid place-items-center text-[10px] font-semibold tracking-wide"
            aria-hidden
          >
            {initials(advisorName)}
          </span>
          <div className="hidden sm:block min-w-0 flex-1">
            <p className="text-xs font-medium truncate leading-tight">
              {advisorName}
            </p>
            <p className="text-[10px] uppercase tracking-[0.08em] text-ink-faint">
              Advisor
            </p>
          </div>
          <form action={signOutAction} className="hidden sm:block">
            <SignOutButton />
          </form>
        </div>
      </div>
    </aside>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Sign out"
      title="Sign out"
      /* Ink, not maroon: signing out isn't a "needs the advisor" signal, and
         tinting it red would spend the one colour that means exactly that. */
      className="p-1.5 rounded-md text-ink-faint transition-colors duration-150 ease-out hover:text-ink hover:bg-rule/45 active:scale-[0.96] disabled:opacity-50"
    >
      <SignOutIcon />
    </button>
  );
}
