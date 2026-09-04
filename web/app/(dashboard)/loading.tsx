/** Skeleton for any dashboard route: the shell is already painted by the
    layout, so this stands in for the content column only. */
export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="px-6 py-4 border-b border-rule">
        <div className="skeleton h-6 w-56" />
        <div className="skeleton h-3 w-72 mt-2" />
      </div>
      <div className="px-6 py-5 space-y-6">
        <section>
          <div className="skeleton h-2.5 w-20 mb-2" />
          <div className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="skeleton h-3 flex-1" style={{ maxWidth: 180 }} />
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-3 w-12" />
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="skeleton h-2.5 w-24 mb-2" />
          <div className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="skeleton h-3 w-40" />
                <div className="skeleton h-3 w-full mt-1.5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
