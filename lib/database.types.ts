// Hand-written to match the real Vizor Supabase schema (introspected via the
// project's PostgREST OpenAPI endpoint). Keep in sync if the schema changes.

export type ProfileRole = "student" | "advisor";
export type TicketStatus = "open" | "resolved";
export type TicketResolution = "soft" | "hard";
export type TicketMessageSender = "student" | "advisor";
export type MessageRole = "user" | "assistant" | "tool" | "system";

export interface ProfileRow {
  id: string;
  auth_user_id: string;
  role: ProfileRole;
  full_name: string;
  email: string;
  created_at: string;
}

export interface StudentRow {
  profile_id: string;
  advisor_id: string;
  class_year: string | null;
  major: string | null;
  gpa: number | null;
}

export interface ConversationRow {
  id: string;
  student_id: string;
  created_at: string;
  last_message_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string | null;
  tool_calls: unknown | null;
  created_at: string;
}

export interface TicketRow {
  id: string;
  student_id: string;
  advisor_id: string;
  conversation_id: string | null;
  status: TicketStatus;
  resolution: TicketResolution | null;
  resolved_by: string | null;
  escalation_reason: string | null;
  ai_summary: string | null;
  category: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface TicketMessageRow {
  id: string;
  ticket_id: string;
  sender: TicketMessageSender;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface DarsReportRow {
  id: string;
  student_id: string;
  program: string;
  program_code: string | null;
  college: string | null;
  catalog_year: string | null;
  expected_grad_term: string | null;
  prepared_on: string | null;
  overall_status: string | null;
  status_code: string | null;
  credits_earned: number | null;
  credits_required: number | null;
  credits_needed: number | null;
  credits_in_progress: number | null;
  asu_gpa: number | null;
  major_gpa: number | null;
  raw_text: string | null;
  created_at: string;
}

export interface DarsRequirementRow {
  id: string;
  report_id: string;
  parent_id: string | null;
  seq: number;
  section_type: string;
  is_optional: boolean;
  code: string | null;
  title: string;
  description: string | null;
  status: string;
  credits_required: number | null;
  credits_earned: number | null;
  credits_in_progress: number | null;
  groups_required: number | null;
  notes: string[] | null;
}

export interface DarsCourseRow {
  id: string;
  requirement_id: string;
  term: string | null;
  term_sort: number | null;
  campus_flag: string | null;
  course_code: string;
  course_title: string | null;
  credits: number | null;
  grade: string | null;
  grade_type: string | null;
  transfer_source: string | null;
  is_in_progress: boolean;
}

type TableDef<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row> };

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      students: TableDef<StudentRow>;
      conversations: TableDef<ConversationRow>;
      messages: TableDef<MessageRow>;
      tickets: TableDef<TicketRow>;
      ticket_messages: TableDef<TicketMessageRow>;
      dars_reports: TableDef<DarsReportRow>;
      dars_requirements: TableDef<DarsRequirementRow>;
      dars_courses: TableDef<DarsCourseRow>;
    };
  };
}
