"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, resolveTicket } from "@/lib/data";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function hardResolveTicketAction(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const advisor = await getAdvisorProfile(supabase, user.id);
  if (!advisor) return;

  await resolveTicket(supabase, ticketId, "hard", advisor.id);
  revalidatePath("/dashboard");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}
