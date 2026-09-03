-- Vizor initial schema. See docs/PROJECT_PLAN.md §5 for the design rationale.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  role          text not null check (role in ('student', 'advisor')),
  full_name     text not null,
  email         text not null unique,
  created_at    timestamptz not null default now()
);

create table students (
  profile_id  uuid primary key references profiles(id) on delete cascade,
  advisor_id  uuid not null references profiles(id),
  class_year  text,
  major       text,
  gpa         numeric(3,2)
);

create table dars_reports (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references students(profile_id) on delete cascade,
  program               text not null,
  program_code          text,
  college               text,
  catalog_year          text,
  expected_grad_term    text,
  prepared_on           timestamptz,
  overall_status        text,
  status_code           text check (status_code in ('met', 'met_with_ip', 'unmet')),
  credits_earned        numeric(6,2),
  credits_required      numeric(6,2),
  credits_needed        numeric(6,2),
  credits_in_progress   numeric(6,2),
  asu_gpa               numeric(3,2),
  major_gpa             numeric(3,2),
  raw_text              text,
  created_at            timestamptz not null default now()
);

create table course_prereqs (
  course_code         text not null,
  prereq_course_code  text not null,
  prereq_type         text not null check (prereq_type in ('required', 'concurrent')),
  primary key (course_code, prereq_course_code)
);

create table dars_requirements (
  id                    uuid primary key default gen_random_uuid(),
  report_id             uuid not null references dars_reports(id) on delete cascade,
  parent_id             uuid references dars_requirements(id) on delete cascade,
  seq                   int not null,
  section_type          text not null check (
    section_type in ('university', 'general_studies', 'major', 'minor', 'gpa', 'informational')
  ),
  is_optional           boolean not null default false,
  code                  text,
  title                 text not null,
  description           text,
  status                text not null check (
    status in ('satisfied', 'in_progress', 'not_satisfied', 'informational')
  ),
  credits_required      numeric(6,2),
  credits_earned        numeric(6,2),
  credits_in_progress   numeric(6,2),
  groups_required       int,
  notes                 text[]
);

create table dars_courses (
  id                uuid primary key default gen_random_uuid(),
  requirement_id    uuid not null references dars_requirements(id) on delete cascade,
  term              text,
  term_sort         int,
  campus_flag       text,
  course_code       text not null,
  course_title      text,
  credits           numeric(4,2),
  grade             text,
  grade_type        text check (grade_type in ('graded', 'in_progress', 'transfer', 'exam_credit')),
  transfer_source   text,
  is_in_progress    boolean not null default false
);

create table conversations (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(profile_id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant', 'tool')),
  content          text,
  tool_calls       jsonb,
  created_at       timestamptz not null default now()
);

create table tickets (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references students(profile_id) on delete cascade,
  advisor_id        uuid not null references profiles(id),
  conversation_id   uuid references conversations(id),
  status            text not null default 'open' check (status in ('open', 'resolved')),
  resolution        text check (resolution in ('hard', 'soft')),
  resolved_by       uuid references profiles(id),
  escalation_reason text,
  ai_summary        text,
  category          text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

create table ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  sender      text not null check (sender in ('student', 'advisor')),
  subject     text,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table kb_documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source_url  text,
  raw_content text,
  created_at  timestamptz not null default now()
);

create table kb_chunks (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references kb_documents(id) on delete cascade,
  content          text not null,
  embedding        vector(4096),
  doc_type         text not null check (doc_type in ('directory', 'procedural', 'policy')),
  majors           text[],
  source_url       text,
  form_url         text,
  title            text,
  section_heading  text
);

-- No ivfflat/HNSW index: pgvector caps both at 2000 dims and this model
-- emits 4096. Brute-force cosine distance is fine at demo corpus size —
-- see supabase/migrations/0003_kb_embedding_dims.sql.

-- Row-level security. See docs/PROJECT_PLAN.md §5 — belt and braces with backend checks.

alter table profiles enable row level security;
alter table students enable row level security;
alter table dars_reports enable row level security;
alter table dars_requirements enable row level security;
alter table dars_courses enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;

create policy profiles_self on profiles for select
  using (auth_user_id = auth.uid());

create policy students_self on students for select
  using (profile_id in (select id from profiles where auth_user_id = auth.uid()));

create policy students_own_advisor on students for select
  using (advisor_id in (select id from profiles where auth_user_id = auth.uid()));

create policy tickets_student on tickets for select
  using (student_id in (select id from profiles where auth_user_id = auth.uid()));

create policy tickets_advisor on tickets for select
  using (advisor_id in (select id from profiles where auth_user_id = auth.uid()));

create policy ticket_messages_via_ticket on ticket_messages for select
  using (ticket_id in (
    select id from tickets where
      student_id in (select id from profiles where auth_user_id = auth.uid())
      or advisor_id in (select id from profiles where auth_user_id = auth.uid())
  ));
