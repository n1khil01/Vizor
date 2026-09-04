"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-6 py-16 max-w-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-maroon-ink">
        Something broke
      </p>
      <h1 className="font-serif text-2xl mt-1.5">
        This page couldn&rsquo;t be loaded.
      </h1>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        The record didn&rsquo;t come back from the server. Your data
        hasn&rsquo;t changed — retrying is safe.
      </p>
      {error.digest && (
        <p className="text-xs text-ink-faint mt-3 tabular">
          Reference {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-md bg-ink text-paper-raised px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out hover:bg-ink/90 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
