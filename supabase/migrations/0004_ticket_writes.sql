-- Write-side RLS for tickets/ticket_messages. 0001_init.sql only granted
-- SELECT, so the advisor web app's resolve/reply actions (and the
-- extension's student-side resolve, added alongside this migration) were
-- silently no-oping under RLS — the anon-key + user-session client used by
-- both surfaces obeys these policies, unlike the backend's service-role key.

create policy tickets_advisor_update on tickets for update
  using (advisor_id in (select id from profiles where auth_user_id = auth.uid()));

create policy tickets_student_update on tickets for update
  using (student_id in (select id from profiles where auth_user_id = auth.uid()));

create policy ticket_messages_insert on ticket_messages for insert
  with check (ticket_id in (
    select id from tickets where
      student_id in (select id from profiles where auth_user_id = auth.uid())
      or advisor_id in (select id from profiles where auth_user_id = auth.uid())
  ));

create policy ticket_messages_update on ticket_messages for update
  using (ticket_id in (
    select id from tickets where
      student_id in (select id from profiles where auth_user_id = auth.uid())
      or advisor_id in (select id from profiles where auth_user_id = auth.uid())
  ));
