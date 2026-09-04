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
