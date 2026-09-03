"use client";

import { useRef, useState, useTransition } from "react";
import { CheckIcon } from "@/components/icons";
import { hardResolveTicketAction } from "@/lib/actions";

const HOLD_MS = 850;

export function ResolveTicketButton({ ticketId }: { ticketId: string }) {
  const [filling, setFilling] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commit() {
    setDone(true);
    startTransition(() => {
      hardResolveTicketAction(ticketId);
    });
  }

  function start() {
    if (done || pending) return;
    setFilling(true);
    timerRef.current = setTimeout(commit, HOLD_MS);
  }

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFilling(false);
  }

  if (done || pending) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md bg-ink text-paper-raised px-4 py-2.5 text-sm font-medium">
        <CheckIcon />
        Resolved — recorded under your name
      </div>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      className="relative overflow-hidden rounded-md border border-ink px-4 py-2.5 text-sm font-medium text-ink select-none"
    >
      <span
        className="absolute inset-0 bg-ink origin-left"
        style={{
          transform: `scaleX(${filling ? 1 : 0})`,
          transition: filling
            ? `transform ${HOLD_MS}ms cubic-bezier(.4,0,.2,1)`
            : "transform 150ms ease-out",
        }}
        aria-hidden
      />
      <span className="relative mix-blend-difference text-white">
        Hold to hard-resolve
      </span>
    </button>
  );
}
