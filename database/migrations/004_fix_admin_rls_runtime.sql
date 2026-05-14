create or replace function public.is_factory_admin()
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
    from public.user_access_levels membership
    join public.access_levels level on level.id = membership.access_level_id
    where membership.user_id = current_uid
      and membership.status = 'active'
      and level.can_access_admin = true
  ) then
    return true;
  end if;

  return
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'superadmin', 'owner'), false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'superadmin', 'owner'), false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin') in ('true', '1'), false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin') in ('true', '1'), false);
end;
$$;

grant execute on function public.is_factory_admin() to anon, authenticated;

insert into public.user_access_levels (user_id, access_level_id, status, notes)
select
  u.id,
  l.id,
  'active',
  'Backfilled admin access from auth metadata'
from auth.users u
join public.access_levels l on l.code = 'admin'
where
  lower(coalesce(u.raw_app_meta_data ->> 'role', '')) in ('admin', 'superadmin', 'owner')
  or lower(coalesce(u.raw_user_meta_data ->> 'role', '')) in ('admin', 'superadmin', 'owner')
  or lower(coalesce(u.raw_app_meta_data ->> 'is_admin', '')) in ('true', '1')
  or lower(coalesce(u.raw_user_meta_data ->> 'is_admin', '')) in ('true', '1')
on conflict (user_id) do update
set
  access_level_id = excluded.access_level_id,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();
