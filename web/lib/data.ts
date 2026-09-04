import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProfileRow,
  StudentRow,
  TicketRow,
  TicketMessageRow,
  ConversationRow,
  MessageRow,
  DarsReportRow,
  DarsRequirementRow,
  DarsCourseRow,
} from "@/lib/database.types";

// Untyped on purpose: supabase-js's generic Database constraint doesn't
// match a hand-written schema without the full generated Relationships/
// Functions/Enums shape. Every query result here is cast back to the real
// row types below, so callers still get full type safety.
type DB = SupabaseClient;

export interface StudentWithProfile extends StudentRow {
  profile: ProfileRow;
}

export interface TicketWithStudent extends TicketRow {
  student: StudentWithProfile | null;
}

export async function getStudentProfile(
  supabase: DB,
  authUserId: string,
): Promise<StudentWithProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("role", "student")
    .maybeSingle();
  if (!profile) return null;

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!student) return null;

  return { ...student, profile };
}

export async function getMyTickets(
  supabase: DB,
  studentId: string,
): Promise<TicketRow[]> {
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyTicket(
  supabase: DB,
  studentId: string,
  ticketId: string,
): Promise<TicketRow | null> {
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("student_id", studentId)
    .maybeSingle();
  return data ?? null;
}

export async function getAdvisorProfile(
  supabase: DB,
  authUserId: string,
): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("role", "advisor")
    .maybeSingle();
  return data;
}

export async function getAdvisorStudents(
  supabase: DB,
  advisorId: string,
): Promise<StudentWithProfile[]> {
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("advisor_id", advisorId);
  if (!students || students.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in(
      "id",
      students.map((s) => s.profile_id),
    );

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return students
    .map((s) => {
      const profile = byId.get(s.profile_id);
      return profile ? { ...s, profile } : null;
    })
    .filter((s): s is StudentWithProfile => s !== null)
    .sort((a, b) => a.profile.full_name.localeCompare(b.profile.full_name));
}

export async function getAdvisorTickets(
  supabase: DB,
  advisorId: string,
): Promise<TicketWithStudent[]> {
  const [{ data: tickets }, students] = await Promise.all([
    supabase
      .from("tickets")
      .select("*")
      .eq("advisor_id", advisorId)
      .order("created_at", { ascending: true }),
    getAdvisorStudents(supabase, advisorId),
  ]);

  const byProfileId = new Map(students.map((s) => [s.profile_id, s]));
  return (tickets ?? []).map((t) => ({
    ...t,
    student: byProfileId.get(t.student_id) ?? null,
  }));
}

export async function getTicket(
  supabase: DB,
  ticketId: string,
): Promise<TicketWithStudent | null> {
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return null;

  const { data: studentRow } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", ticket.student_id)
    .maybeSingle();
  if (!studentRow) return { ...ticket, student: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentRow.profile_id)
    .maybeSingle();

  return {
    ...ticket,
    student: profile ? { ...studentRow, profile } : null,
  };
}

export async function getTicketMessages(
  supabase: DB,
  ticketId: string,
): Promise<TicketMessageRow[]> {
  const { data } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function sendTicketMessage(
  supabase: DB,
  ticketId: string,
  sender: "student" | "advisor",
  body: string,
  subject: string | null = null,
): Promise<void> {
  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender,
    subject,
    body,
  });
}

export async function resolveTicket(
  supabase: DB,
  ticketId: string,
  resolution: "soft" | "hard",
  resolvedByProfileId: string | null,
): Promise<void> {
  await supabase
    .from("tickets")
    .update({
      status: "resolved",
      resolution,
      resolved_by: resolvedByProfileId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", ticketId);
}

export interface ConversationWithStudent extends ConversationRow {
  student: StudentWithProfile | null;
}

export async function getAdvisorConversations(
  supabase: DB,
  advisorId: string,
): Promise<ConversationWithStudent[]> {
  const students = await getAdvisorStudents(supabase, advisorId);
  if (students.length === 0) return [];

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .in(
      "student_id",
      students.map((s) => s.profile_id),
    )
    .order("last_message_at", { ascending: false });

  const byProfileId = new Map(students.map((s) => [s.profile_id, s]));
  return (conversations ?? []).map((c) => ({
    ...c,
    student: byProfileId.get(c.student_id) ?? null,
  }));
}

export async function getStudentConversations(
  supabase: DB,
  studentId: string,
): Promise<ConversationRow[]> {
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("student_id", studentId)
    .order("last_message_at", { ascending: false });
  return data ?? [];
}

export async function getMessagesForConversations(
  supabase: DB,
  conversationIds: string[],
): Promise<Map<string, MessageRow[]>> {
  if (conversationIds.length === 0) return new Map();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  const byConversation = new Map<string, MessageRow[]>();
  for (const m of data ?? []) {
    const list = byConversation.get(m.conversation_id) ?? [];
    list.push(m);
    byConversation.set(m.conversation_id, list);
  }
  return byConversation;
}

export async function getConversation(
  supabase: DB,
  conversationId: string,
): Promise<ConversationWithStudent | null> {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return null;

  const { data: studentRow } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", conversation.student_id)
    .maybeSingle();
  if (!studentRow) return { ...conversation, student: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentRow.profile_id)
    .maybeSingle();

  return {
    ...conversation,
    student: profile ? { ...studentRow, profile } : null,
  };
}

export async function getConversationMessages(
  supabase: DB,
  conversationId: string,
): Promise<MessageRow[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export interface DarsReportWithStudent extends DarsReportRow {
  student: StudentWithProfile | null;
}

export async function getAdvisorDarsReports(
  supabase: DB,
  advisorId: string,
): Promise<DarsReportWithStudent[]> {
  const students = await getAdvisorStudents(supabase, advisorId);
  if (students.length === 0) return [];

  const { data: reports } = await supabase
    .from("dars_reports")
    .select("*")
    .in(
      "student_id",
      students.map((s) => s.profile_id),
    )
    .order("prepared_on", { ascending: false });

  const byProfileId = new Map(students.map((s) => [s.profile_id, s]));
  return (reports ?? []).map((r) => ({
    ...r,
    student: byProfileId.get(r.student_id) ?? null,
  }));
}

export async function getStudentDarsReports(
  supabase: DB,
  studentId: string,
): Promise<DarsReportRow[]> {
  const { data } = await supabase
    .from("dars_reports")
    .select("*")
    .eq("student_id", studentId)
    .order("prepared_on", { ascending: false });
  return data ?? [];
}

export interface DarsRequirementNode extends DarsRequirementRow {
  children: DarsRequirementNode[];
  courses: DarsCourseRow[];
}

export async function getDarsReportTree(
  supabase: DB,
  reportId: string,
): Promise<DarsRequirementNode[]> {
  const { data: requirements } = await supabase
    .from("dars_requirements")
    .select("*")
    .eq("report_id", reportId)
    .order("seq", { ascending: true });
  if (!requirements || requirements.length === 0) return [];

  const { data: courses } = await supabase
    .from("dars_courses")
    .select("*")
    .in(
      "requirement_id",
      requirements.map((r) => r.id),
    );

  const coursesByReq = new Map<string, DarsCourseRow[]>();
  for (const c of courses ?? []) {
    const list = coursesByReq.get(c.requirement_id) ?? [];
    list.push(c);
    coursesByReq.set(c.requirement_id, list);
  }

  const nodes = new Map<string, DarsRequirementNode>(
    requirements.map((r) => [
      r.id,
      { ...r, children: [], courses: coursesByReq.get(r.id) ?? [] },
    ]),
  );

  const roots: DarsRequirementNode[] = [];
  for (const r of requirements) {
    const node = nodes.get(r.id)!;
    if (r.parent_id && nodes.has(r.parent_id)) {
      nodes.get(r.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
