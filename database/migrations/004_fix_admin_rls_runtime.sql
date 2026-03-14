create or replace function public.is_mnb_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_uid uuid;
begin
  current_uid := auth.uid();

  if current_uid is not null and exists (
    select 1
    from public.customer_level_memberships membership
    join public.customer_levels level on level.id = membership.level_id
    where membership.user_id = current_uid
      and membership.status = 'active'
      and level.can_access_admin = true
  ) then
    return true;
  end if;

  return
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin') in ('true', '1'), false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin') in ('true', '1'), false);
end;
$$;

grant execute on function public.is_mnb_admin() to anon, authenticated;

alter table if exists public.courses enable row level security;
alter table if exists public.course_lessons enable row level security;
alter table if exists public.course_enrollments enable row level security;

drop policy if exists "courses_admin_manage" on public.courses;
create policy "courses_admin_manage"
on public.courses
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

drop policy if exists "course_enrollments_admin_manage" on public.course_enrollments;
create policy "course_enrollments_admin_manage"
on public.course_enrollments
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

drop policy if exists "course_lessons_admin_manage" on public.course_lessons;
create policy "course_lessons_admin_manage"
on public.course_lessons
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

insert into public.customer_level_memberships (user_id, level_id, status, notes)
select
  u.id,
  l.id,
  'active',
  'Grant admin access from migration 004'
from auth.users u
join public.customer_levels l on l.code = 'admin'
where lower(u.email) = 'panupong.chinn@gmail.com'
on conflict (user_id) do update
set
  level_id = excluded.level_id,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();
