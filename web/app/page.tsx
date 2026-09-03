import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="flex items-baseline gap-2">
          <span className="font-sans font-bold text-lg tracking-tight">
            Vizor
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            for Advisors
          </span>
        </span>
        <Link
          href="/login"
          className="text-sm font-medium border border-ink rounded-md px-4 py-2 hover:bg-ink hover:text-paper-raised transition-colors"
        >
          Sign in
        </Link>
      </header>

      <section className="px-6 sm:px-10 pt-10 pb-16 max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <div className="flex items-center gap-1.5 mb-5" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-maroon" />
            <span className="w-2.5 h-2.5 rounded-full bg-gold" />
            <span className="w-2.5 h-2.5 rounded-full bg-ink" />
          </div>
          <h1 className="font-sans font-bold text-[2.75rem] sm:text-[3.75rem] leading-[1.03] tracking-tight">
            Every ticket arrives{" "}
            <span className="font-serif italic font-normal">
              already understood.
            </span>
          </h1>
          <p className="font-serif text-lg sm:text-xl text-ink-soft mt-6 leading-relaxed max-w-xl">
            Vizor is an AI advising assistant. Its chat extension gives ASU
            students myASU- and DARS-grounded answers on the spot — and hands
            you, their advisor, only what actually needs a human, with the
            student&rsquo;s context already assembled.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-ink text-paper-raised px-5 py-3 text-sm font-medium hover:bg-ink/90 transition-colors"
            >
              Sign in as an advisor
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-10 pb-16 max-w-6xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-3">
          What lands in your queue
        </p>
        <div className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule overflow-hidden">
          <ExampleRow
            state="maroon"
            name="A student"
            category="Major change"
            summary="Wants to explore switching majors but hasn’t named a target program — needs a real conversation, not a DARS lookup."
          />
          <ExampleRow
            state="gold"
            name="A student"
            category="Records request"
            summary="Needed an unofficial transcript for a scholarship deadline. Vizor pointed them to the right place; they closed it themselves."
          />
          <ExampleRow
            state="ink"
            name="A student"
            category="Registration hold"
            summary="Transfer credit didn’t auto-match a prerequisite. You reviewed it, approved the waiver, and Vizor updated the record."
          />
        </div>
        <p className="text-xs text-ink-faint mt-3">
          Illustrative examples — not real student records.
        </p>
      </section>

      <section className="grid sm:grid-cols-3 border-t border-rule">
        <LegendPanel
          color="bg-maroon"
          text="text-paper-raised"
          label="Needs you"
          body="Vizor couldn't resolve it — the student's full chat context and DARS reasoning are already attached, so you're never starting cold."
        />
        <LegendPanel
          color="bg-gold"
          text="text-ink"
          label="Student resolved"
          body="The student handled it themselves, with Vizor's help, and closed it. Lower priority, but visible so nothing goes unseen."
        />
        <LegendPanel
          color="bg-ink"
          text="text-paper-raised"
          label="You resolved"
          body="A deliberate, committed action on your end — an auditable record of the judgment call only an advisor could make."
        />
      </section>

      <footer className="px-6 sm:px-10 py-10 max-w-6xl mx-auto">
        <p className="text-sm text-ink-faint max-w-xl">
          Students reach Vizor through a browser extension on ASU sites; this
          is the advisor side, built for the ASU AIR Spark Challenge on ASU
          AIR.
        </p>
      </footer>
    </main>
  );
}

function ExampleRow({
  state,
  name,
  category,
  summary,
}: {
  state: "maroon" | "gold" | "ink";
  name: string;
  category: string;
  summary: string;
}) {
  const dot = { maroon: "bg-maroon", gold: "bg-gold", ink: "bg-ink" }[state];
  return (
    <div className="flex items-start gap-4 px-4 py-4">
      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-medium text-sm">{name}</span>
          <span className="text-xs uppercase tracking-wide text-ink-faint">
            {category}
          </span>
        </div>
        <p className="text-sm text-ink-soft mt-0.5">{summary}</p>
      </div>
    </div>
  );
}

function LegendPanel({
  color,
  text,
  label,
  body,
}: {
  color: string;
  text: string;
  label: string;
  body: string;
}) {
  return (
    <div className={`${color} ${text} px-6 sm:px-10 py-10`}>
      <p className="text-sm font-medium uppercase tracking-wide opacity-80 mb-2">
        {label}
      </p>
      <p className="text-sm leading-relaxed opacity-95 max-w-xs">{body}</p>
    </div>
  );
}
