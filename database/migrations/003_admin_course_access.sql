alter table if exists public.courses enable row level security;
alter table if exists public.course_lessons enable row level security;
alter table if exists public.course_enrollments enable row level security;

drop policy if exists "courses_public_select" on public.courses;
create policy "courses_public_select"
on public.courses
for select
to anon, authenticated
using (true);

drop policy if exists "courses_admin_manage" on public.courses;
create policy "courses_admin_manage"
on public.courses
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

drop policy if exists "course_enrollments_select_own_or_admin" on public.course_enrollments;
create policy "course_enrollments_select_own_or_admin"
on public.course_enrollments
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_mnb_admin()
);

drop policy if exists "course_enrollments_admin_manage" on public.course_enrollments;
create policy "course_enrollments_admin_manage"
on public.course_enrollments
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

drop policy if exists "course_lessons_select_enrolled_or_admin" on public.course_lessons;
create policy "course_lessons_select_enrolled_or_admin"
on public.course_lessons
for select
to authenticated
using (
  public.is_mnb_admin()
  or exists (
    select 1
    from public.course_enrollments enrollment
    where enrollment.course_id = course_lessons.course_id
      and enrollment.user_id = auth.uid()
  )
);

drop policy if exists "course_lessons_admin_manage" on public.course_lessons;
create policy "course_lessons_admin_manage"
on public.course_lessons
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

comment on policy "courses_admin_manage" on public.courses is 'Allow M&B admins to insert, update and delete courses';
comment on policy "course_enrollments_admin_manage" on public.course_enrollments is 'Allow M&B admins to manage course access grants';
comment on policy "course_lessons_admin_manage" on public.course_lessons is 'Allow M&B admins to insert, update and delete lessons';
