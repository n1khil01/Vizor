import { createClient } from "@/lib/supabase/server";
import { getAdvisorProfile, getAdvisorStudents, getAdvisorTickets } from "@/lib/data";
import { CaseloadStrip } from "@/components/CaseloadStrip";
import { PageHeader } from "@/components/PageHeader";

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

  const withOpen = students.filter((s) =>
    tickets.some((t) => t.student_id === s.profile_id && t.status === "open"),
  ).length;

  return (
    <>
      <PageHeader
        title="Students"
        meta={
          <>
            {students.length} assigned ·{" "}
            <span className={withOpen > 0 ? "text-maroon-ink font-medium" : ""}>
              {withOpen} with open tickets
            </span>
          </>
        }
      />
      <div className="px-6 py-5">
        <CaseloadStrip students={students} tickets={tickets} />
      </div>
    </>
  );
}
