"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  role = "advisor",
}: {
  role?: "advisor" | "student";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const wrongRoleError =
    role === "advisor"
      ? "That account isn't registered as an advisor."
      : "That account isn't registered as a student.";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "not-an-advisor" || params.get("error") === "not-a-student"
      ? wrongRoleError
      : null,
  );
  const [loading, setLoading] = useState(false);
  const defaultNext = role === "student" ? "/portal" : "/dashboard";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    router.push(params.get("next") ?? defaultNext);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        placeholder="schen@asu.edu"
        invalid={Boolean(error)}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        invalid={Boolean(error)}
      />

      {error && (
        <p
          className="text-sm text-maroon-ink border-l-2 border-maroon pl-3 py-0.5"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full rounded-md bg-ink text-paper-raised px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out hover:bg-ink/90 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

/** The shape of the form while the client bundle hydrates — same metrics, so
    nothing shifts when the real fields arrive. */
export function LoginFormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i}>
          <div className="skeleton h-2.5 w-16 mb-2" />
          <div className="skeleton h-[42px] w-full rounded-md" />
        </div>
      ))}
      <div className="skeleton h-[42px] w-full rounded-md" />
    </div>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        aria-invalid={invalid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border bg-paper-raised px-3 py-2.5 text-sm transition-colors duration-150 ease-out placeholder:text-ink-faint hover:border-rule-strong focus:outline-none ${
          invalid ? "border-maroon" : "border-rule focus:border-maroon"
        }`}
      />
    </div>
  );
}
