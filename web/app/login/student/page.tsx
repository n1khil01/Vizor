import { Suspense } from "react";
import Link from "next/link";
import { LoginForm, LoginFormSkeleton } from "../LoginForm";
import { VizorMark } from "@/components/VizorMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeftIcon } from "@/components/icons";

export const metadata = { title: "Student sign in — Vizor" };

export default function StudentLoginPage() {
  return (
    <main className="min-h-dvh grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16 relative">
        {/* Pinned to the page corner, not the centred form column — mirrors
            the advisor sign-in page and ThemeToggle opposite it. */}
        <Link
          href="/"
          title="Back to Vizor"
          className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-sm"
        >
          <VizorMark className="h-8" />
          <span className="hidden sm:flex items-baseline gap-1.5">
            <span className="font-sans font-bold text-base tracking-tight">
              Vizor
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Student
            </span>
          </span>
        </Link>
        <ThemeToggle className="absolute top-6 right-6" />

        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1 -ml-1 mb-8 rounded px-1 py-0.5 text-xs font-medium text-ink-faint transition-colors duration-150 ease-out hover:text-ink"
          >
            <ChevronLeftIcon />
            Back to Vizor
          </Link>

          <h1 className="font-serif text-2xl">Sign in</h1>
          <p className="text-sm text-ink-soft mt-1 mb-7">
            Track your tickets and advising history.
          </p>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm role="student" />
          </Suspense>

          <p className="text-sm text-ink-faint mt-6">
            Advisor?{" "}
            <Link href="/login" className="underline hover:text-ink">
              Sign in here
            </Link>
            .
          </p>
        </div>
      </div>

      <aside className="ruled hidden lg:flex items-center justify-center border-l border-rule px-10">
        <blockquote className="max-w-sm">
          <p className="font-serif text-2xl leading-snug text-balance">
            Every ticket you send,{" "}
            <span className="italic">tracked in one place.</span>
          </p>
          <p className="text-sm text-ink-soft mt-3 leading-relaxed">
            See what&rsquo;s still in progress and what your advisor has
            already resolved.
          </p>
        </blockquote>
      </aside>
    </main>
  );
}
