import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="px-6 py-16 max-w-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        Not found
      </p>
      <h1 className="font-serif text-2xl mt-1.5">
        That record isn&rsquo;t on your ledger.
      </h1>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        It may have been resolved and removed, or it belongs to another
        advisor&rsquo;s caseload — you only ever see students assigned to you.
      </p>
      <Link
        href="/dashboard"
        className="inline-block mt-5 rounded-md border border-ink px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out hover:bg-ink hover:text-paper-raised active:scale-[0.98]"
      >
        Back to overview
      </Link>
    </div>
  );
}
