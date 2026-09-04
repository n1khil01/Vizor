import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ruled min-h-dvh grid place-items-center px-6 py-16">
      <div className="max-w-md bg-paper-raised border border-rule rounded-lg px-6 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          404
        </p>
        <h1 className="font-serif text-2xl mt-1.5">
          There&rsquo;s no page here.
        </h1>
        <p className="text-sm text-ink-soft mt-2 leading-relaxed">
          The link may be out of date. If you were signed in, your overview is
          still where you left it.
        </p>
        <Link
          href="/"
          className="inline-block mt-5 rounded-md bg-ink text-paper-raised px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out hover:bg-ink/90 active:scale-[0.98]"
        >
          Back to Vizor
        </Link>
      </div>
    </main>
  );
}
