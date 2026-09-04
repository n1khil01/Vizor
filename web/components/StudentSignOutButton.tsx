"use client";

import { useFormStatus } from "react-dom";
import { SignOutIcon } from "@/components/icons";
import { signOutStudentAction } from "@/lib/actions";

export function StudentSignOutButton() {
  return (
    <form action={signOutStudentAction}>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Sign out"
      title="Sign out"
      /* Ink, not maroon: signing out isn't a "needs the advisor" signal, and
         tinting it red would spend the one colour that means exactly that. */
      className="p-1.5 rounded-md text-ink-faint transition-colors duration-150 ease-out hover:text-ink hover:bg-rule/45 active:scale-[0.96] disabled:opacity-50"
    >
      <SignOutIcon />
    </button>
  );
}
