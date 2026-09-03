import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorStudents, getAdvisorTickets } from "@/lib/data";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const advisor = await getAdvisorProfile(supabase, user.id);
  if (!advisor) {
    redirect("/login?error=not-an-advisor");
  }

  const [students, tickets] = await Promise.all([
    getAdvisorStudents(supabase, advisor.id),
    getAdvisorTickets(supabase, advisor.id),
  ]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar advisorName={advisor.full_name} />
      <div className="flex-1 min-w-0">{children}</div>
      <RightRail students={students} tickets={tickets} />
    </div>
  );
}
