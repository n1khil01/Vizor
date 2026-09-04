"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { hardResolveTicketAction } from "@/lib/actions";

const HOLD_MS = 850;

/**
 * The signature commit gesture: a deliberate press-and-hold standing in for a
 * signature, so a hard resolve can't be fired by a stray click.
 *
 * "Deliberate" has to mean deliberate for everyone, so the hold is driven by
 * pointer *and* keyboard (focus it and hold Space or Enter) — a mouse-only
 * gesture would put the app's primary action out of reach of keyboard and
 * switch users.
 *
 * The commit runs off a timer and the sweep off a CSS transition, rather than
 * both off requestAnimationFrame: frame callbacks stop in a backgrounded tab,
 * which would strand a hold half-committed. A timer still fires there, so the
 * gesture always resolves to one state or the other.
 */
export function ResolveTicketButton({ ticketId }: { ticketId: string }) {
  const [holding, setHolding] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintId = useId();

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const commit = useCallback(async () => {
    setHolding(false);
    setStatus("saving");
    const result = await hardResolveTicketAction(ticketId);
    if (result.ok) {
      setStatus("done");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }, [ticketId]);

  const start = useCallback(() => {
    if (timerRef.current !== null || status === "saving" || status === "done") {
      return;
    }
    setError(null);
    setHolding(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void commit();
    }, HOLD_MS);
  }, [commit, status]);

  const cancel = useCallback(() => {
    if (timerRef.current === null) return;
    clearTimer();
    setHolding(false);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  if (status === "done") {
    return (
      <p
        className="inline-flex items-center gap-2 rounded-md bg-ink text-paper-raised px-4 py-2.5 text-sm font-medium"
        role="status"
      >
        <CheckIcon />
        Resolved — recorded under your name
      </p>
    );
  }

  const label =
    status === "saving"
      ? "Recording…"
      : holding
        ? "Keep holding…"
        : "Hold to hard-resolve";

  return (
    <div>
      <button
        type="button"
        disabled={status === "saving"}
        aria-describedby={hintId}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.focus();
          start();
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (!e.repeat) start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") cancel();
        }}
        onBlur={cancel}
        className="relative isolate overflow-hidden rounded-md border border-ink px-4 py-2.5 text-sm font-medium text-ink select-none touch-none transition-colors duration-150 ease-out hover:bg-ink/5 disabled:opacity-60 disabled:pointer-events-none"
      >
        {/* Sizes the button; the two visible layers sit on top of it. */}
        <span className="invisible whitespace-nowrap">Hold to hard-resolve</span>
        <span className="absolute inset-0 grid place-items-center whitespace-nowrap">
          {label}
        </span>
        {/* The same label again, clipped inside the advancing ink — two real
            text layers rather than a mix-blend trick, so the colour is
            predictable at every point of the sweep. */}
        <span
          className="absolute inset-0 bg-ink grid place-items-center whitespace-nowrap text-paper-raised"
          style={{
            clipPath: `inset(0 ${holding ? 0 : 100}% 0 0)`,
            transition: holding
              ? `clip-path ${HOLD_MS}ms cubic-bezier(.4,0,.2,1)`
              : "clip-path 150ms ease-out",
          }}
          aria-hidden
        >
          {label}
        </span>
      </button>

      <p id={hintId} className="text-xs text-ink-faint mt-1.5">
        Press and hold, or focus and hold Space, for {HOLD_MS / 1000} seconds.
      </p>

      {status === "error" && error && (
        <p className="text-sm text-maroon-ink mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
