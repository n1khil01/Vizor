"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-baseline gap-2 mb-10">
          <span className="font-sans font-bold text-lg tracking-tight">
            Vizor
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Advisor
          </span>
        </Link>

        <h1 className="font-serif text-2xl mb-1.5">Sign in</h1>
        <p className="text-sm text-ink-soft mb-8">
          Your advising caseload, one ledger.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-ink-faint mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-rule bg-paper-raised px-3 py-2.5 text-sm focus:border-maroon outline-none transition-colors"
              placeholder="schen@asu.edu"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-ink-faint mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-rule bg-paper-raised px-3 py-2.5 text-sm focus:border-maroon outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-maroon-ink" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-ink text-paper-raised px-4 py-2.5 text-sm font-medium disabled:opacity-60 hover:bg-ink/90 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
