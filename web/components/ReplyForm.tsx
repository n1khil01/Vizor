"use client";

import { useId, useState, useTransition } from "react";
import { replyToTicketAction } from "@/lib/actions";

const MAX = 4000;

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  const trimmed = value.trim();
  const tooLong = value.length > MAX;
  const canSend = trimmed.length > 0 && !tooLong && !pending;

  function submit() {
    if (!canSend) return;
    setError(null);
    setSent(false);
    startTransition(async () => {
      const result = await replyToTicketAction(ticketId, trimmed);
      if (result.ok) {
        setValue("");
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={fieldId} className="sr-only">
        Reply to the student
      </label>
      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSent(false);
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Reply to the student…"
        rows={4}
        disabled={pending}
        aria-invalid={Boolean(error) || tooLong}
        aria-describedby={error || tooLong ? errorId : undefined}
        className={`w-full rounded-lg border bg-paper-raised p-3 text-sm leading-relaxed transition-colors duration-150 ease-out placeholder:text-ink-faint hover:border-rule-strong focus:outline-none disabled:opacity-60 ${
          error || tooLong ? "border-maroon" : "border-rule focus:border-maroon"
        }`}
      />

      <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-md border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-ink hover:text-paper-raised active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          {pending ? "Sending…" : "Send reply"}
        </button>

        <p
          className={`text-xs tabular ${
            tooLong ? "text-maroon-ink font-medium" : "text-ink-faint"
          }`}
        >
          {value.length}/{MAX} · ⌘↵ to send
        </p>
      </div>

      {(error || tooLong) && (
        <p id={errorId} className="text-sm text-maroon-ink mt-2" role="alert">
          {tooLong ? `Trim this to ${MAX} characters or fewer.` : error}
        </p>
      )}
      {sent && !error && (
        <p className="text-sm text-ink-soft mt-2" role="status">
          Reply sent.
        </p>
      )}
    </form>
  );
}
