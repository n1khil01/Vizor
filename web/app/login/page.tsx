import { Suspense } from "react";
import Link from "next/link";
import { LoginForm, LoginFormSkeleton } from "./LoginForm";

export const metadata = { title: "Sign in — Vizor" };

export default function LoginPage() {
  return (
    /* No ruled ground under the form: a centred card floating on ruled paper
       reads as an accident. The ledger begins once you're inside it. */
    <main className="min-h-dvh grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-baseline gap-2 mb-10 rounded-sm"
          >
            <span className="font-sans font-bold text-base tracking-tight">
              Vizor
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Advisor
            </span>
          </Link>

          <h1 className="font-serif text-2xl">Sign in</h1>
          <p className="text-sm text-ink-soft mt-1 mb-7">
            Your advising caseload, one ledger.
          </p>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* The ruled ground appears here as a preview of the surface you're
          signing in to, rather than as wallpaper behind the form. */}
      <aside className="ruled hidden lg:flex items-center justify-center border-l border-rule px-10">
        <blockquote className="max-w-sm">
          <p className="font-serif text-2xl leading-snug text-balance">
            Every ticket arrives{" "}
            <span className="italic">already understood.</span>
          </p>
          <p className="text-sm text-ink-soft mt-3 leading-relaxed">
            Session context, escalation reason, and the student&rsquo;s DARS
            audit are attached before you open it.
          </p>
        </blockquote>
      </aside>
    </main>
  );
}
