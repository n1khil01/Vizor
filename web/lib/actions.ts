"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getTicket, resolveTicket, sendTicketMessage } from "@/lib/data";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Same sign-out, routed back to the student login screen rather than the
    advisor one, so a signed-out student lands somewhere that already makes
    sense for them instead of the advisor email placeholder. */
export async function signOutStudentAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login/student");
}

/** The brand mark doubles as a sign-out, so leaving the app for the public
    landing page ends the session instead of leaving it live behind a page
    that looks signed-out. This has to be a Server Action rather than a
    <Link href="/">: Next prefetches links, so a logout that happened on
    GET / would fire without anyone clicking it, and auth cookies can't be
    cleared from a Server Component render at all. */
export async function signOutToHomeAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Every action reports back so the UI can show a real error instead of
    silently doing nothing. */
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function hardResolveTicketAction(
  ticketId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const advisor = await getAdvisorProfile(supabase, user.id);
  if (!advisor) return { ok: false, error: "Your advisor profile wasn't found." };

  const ticket = await getTicket(supabase, ticketId);
  if (!ticket || ticket.advisor_id !== advisor.id) {
    return { ok: false, error: "This ticket isn't assigned to you." };
  }

  try {
    await resolveTicket(supabase, ticketId, "hard", advisor.id);
  } catch {
    return { ok: false, error: "Couldn't record the resolution. Try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { ok: true };
}

export async function replyToTicketAction(
  ticketId: string,
  body: string,
): Promise<ActionResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Write a reply before sending." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const advisor = await getAdvisorProfile(supabase, user.id);
  if (!advisor) return { ok: false, error: "Your advisor profile wasn't found." };

  // Ownership check: RLS also blocks a cross-advisor insert, but failing
  // loudly here beats a silently no-op'd write.
  const ticket = await getTicket(supabase, ticketId);
  if (!ticket || ticket.advisor_id !== advisor.id) {
    return { ok: false, error: "This ticket isn't assigned to you." };
  }

  try {
    await sendTicketMessage(supabase, ticketId, "advisor", trimmed);
  } catch {
    return { ok: false, error: "Couldn't send the reply. Try again." };
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
