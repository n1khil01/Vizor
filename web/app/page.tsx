import Link from "next/link";
import { StateDot, STATE_META, STATE_ORDER } from "@/components/StateDot";
import { VizorMark } from "@/components/VizorMark";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Illustrative only — deliberately not real student records. */
const EXAMPLES = [
  {
    state: "open" as const,
    category: "Major change",
    summary:
      "Wants to explore switching majors but hasn't named a target program — needs a real conversation, not a DARS lookup.",
  },
  {
    state: "soft" as const,
    category: "Records request",
    summary:
      "Needed an unofficial transcript for a scholarship deadline. Vizor pointed them to the right place; they closed it themselves.",
  },
  {
    state: "hard" as const,
    category: "Registration hold",
    summary:
      "Transfer credit didn't auto-match a prerequisite. You reviewed it, approved the waiver, and Vizor updated the record.",
  },
];

export default function LandingPage() {
  return (
    <main className="ruled">
      <header className="border-b border-rule">
        <div className="px-6 sm:px-10 h-14 flex items-center justify-between max-w-6xl mx-auto w-full">
          <span className="flex items-center gap-2">
            <VizorMark className="h-8" />
            <span className="flex items-baseline gap-2">
              <span className="font-sans font-bold text-base tracking-tight">
                Vizor
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                for Advisors
              </span>
            </span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium border border-ink rounded-md px-3.5 py-1.5 transition-colors duration-150 ease-out hover:bg-ink hover:text-paper-raised active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Asymmetric by intent: the claim sits in the left column, the thing
          being claimed about — the queue itself — sits beside it, so the page
          shows the product rather than describing it into empty space. */}
      <section className="px-6 sm:px-10 py-14 max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-14 items-start">
        <div>
          <div className="flex items-center gap-1.5 mb-5" aria-hidden>
            {STATE_ORDER.map((s) => (
              <StateDot key={s} state={s} />
            ))}
          </div>
          <h1 className="font-sans font-bold text-[2.5rem] sm:text-[3.25rem] leading-[1.03] tracking-tight text-balance">
            Every ticket arrives{" "}
            <span className="font-serif italic font-normal">
              already understood.
            </span>
          </h1>
          <p className="font-serif text-lg text-ink-soft mt-5 leading-relaxed max-w-prose">
            Vizor is an AI advising assistant. Its chat extension gives ASU
            students myASU- and DARS-grounded answers on the spot — and hands
            you, their advisor, only what actually needs a human, with the
            student&rsquo;s context already assembled.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-ink text-paper-raised px-5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out hover:bg-ink/90 active:scale-[0.98]"
            >
              Sign in as an advisor
            </Link>
            <Link
              href="/login/student"
              className="inline-flex items-center rounded-md border border-ink px-5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out hover:bg-ink hover:text-paper-raised active:scale-[0.98]"
            >
              Sign in as a student
            </Link>
          </div>
        </div>

        <div className="lg:pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
            What lands in your queue
          </p>
          <ol className="border border-rule rounded-lg bg-paper-raised divide-y divide-rule overflow-hidden">
            {EXAMPLES.map((e) => (
              <li key={e.category} className="px-4 py-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                    {e.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ml-auto ${STATE_META[e.state].text}`}
                  >
                    <StateDot state={e.state} size="sm" />
                    {STATE_META[e.state].label}
                  </span>
                </div>
                <p className="text-sm text-ink-soft leading-snug mt-1">
                  {e.summary}
                </p>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-ink-faint mt-2">
            Illustrative examples — not real student records.
          </p>
        </div>
      </section>

      {/* The state grammar, flooded full-bleed: three colours, three
          meanings, the same three you'll see on every row inside. */}
      <section
        aria-label="What each state means"
        className="grid sm:grid-cols-3 border-t border-rule"
      >
        {STATE_ORDER.map((s) => {
          const meta = STATE_META[s];
          return (
            <div
              key={s}
              className={`${meta.band} ${meta.bandText} px-6 sm:px-10 py-9`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-80 mb-1.5">
                {meta.label}
              </p>
              <p className="text-sm leading-relaxed max-w-xs">{LONG[s]}</p>
            </div>
          );
        })}
      </section>

      <footer className="px-6 sm:px-10 py-8 max-w-6xl mx-auto">
        <p className="text-sm text-ink-faint max-w-xl leading-relaxed">
          Students reach Vizor through a browser extension on ASU sites; this
          is the advisor side, built for the ASU AIR Spark Challenge on ASU
          AIR.
        </p>
      </footer>
    </main>
  );
}

const LONG: Record<(typeof STATE_ORDER)[number], string> = {
  open: "Vizor couldn't resolve it — the student's full chat context and DARS reasoning are already attached, so you're never starting cold.",
  soft: "The student handled it themselves, with Vizor's help, and closed it. Lower priority, but visible so nothing goes unseen.",
  hard: "A deliberate, committed action on your end — an auditable record of the judgment call only an advisor could make.",
};
