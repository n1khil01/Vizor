import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile } from "@/lib/data";
import { StudentSignOutButton } from "@/components/StudentSignOutButton";
import { signOutToHomeAction } from "@/lib/actions";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const student = await getStudentProfile(supabase, user.id);
  if (!student) redirect("/login/student?error=not-a-student");

  return (
    <div className="min-h-dvh ruled">
      <header className="border-b border-rule">
        <div className="px-6 sm:px-10 h-14 flex items-center justify-between max-w-4xl mx-auto w-full">
          {/* Signs out on the way to the landing page — see
              signOutToHomeAction for why this is a form and not a <Link>. */}
          <form action={signOutToHomeAction}>
            <button
              type="submit"
              title="Back to Vizor — signs you out"
              className="flex items-baseline gap-2 rounded-sm"
            >
              <span className="font-sans font-bold text-base tracking-tight">
                Vizor
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Student Portal
              </span>
            </button>
          </form>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft">
              {student.profile.full_name}
            </span>
            <StudentSignOutButton />
          </div>
        </div>
      </header>
      <main className="px-6 sm:px-10 py-8 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
