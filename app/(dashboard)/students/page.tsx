import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorStudents, getAdvisorTickets } from "@/lib/data";
import { CaseloadStrip } from "@/components/CaseloadStrip";

export const metadata = { title: "Students — Vizor" };

export default async function StudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const advisor = (await getAdvisorProfile(supabase, user!.id))!;

  const [students, tickets] = await Promise.all([
    getAdvisorStudents(supabase, advisor.id),
    getAdvisorTickets(supabase, advisor.id),
  ]);

  return (
    <main className="px-8 py-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">Students</h1>
        <p className="text-ink-soft mt-1.5">Your assigned caseload.</p>
      </header>
      <CaseloadStrip students={students} tickets={tickets} />
    </main>
  );
}
