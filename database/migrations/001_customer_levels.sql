create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.customer_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  priority integer not null default 100,
  is_default boolean not null default false,
  can_access_courses boolean not null default true,
  can_access_premium_courses boolean not null default false,
  can_access_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_levels_code_format check (code ~ '^[a-z0-9_\\-]+$')
);

create unique index if not exists customer_levels_one_default_idx
on public.customer_levels (is_default)
where is_default = true;

create table if not exists public.customer_level_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id uuid not null references public.customer_levels(id) on delete restrict,
  status text not null default 'active',
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_level_memberships_status_check check (status in ('active', 'inactive', 'expired', 'suspended')),
  constraint customer_level_memberships_one_level_per_user unique (user_id)
);

create index if not exists customer_level_memberships_level_id_idx
on public.customer_level_memberships (level_id);

create index if not exists customer_level_memberships_status_idx
on public.customer_level_memberships (status);

drop trigger if exists set_customer_levels_updated_at on public.customer_levels;
create trigger set_customer_levels_updated_at
before update on public.customer_levels
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_customer_level_memberships_updated_at on public.customer_level_memberships;
create trigger set_customer_level_memberships_updated_at
before update on public.customer_level_memberships
for each row
execute function public.set_current_timestamp_updated_at();

insert into public.customer_levels (
  code,
  name,
  description,
  priority,
  is_default,
  can_access_courses,
  can_access_premium_courses,
  can_access_admin
)
values
  ('customer', 'Customer', 'ลูกค้าทั่วไปที่สมัครสมาชิกในเว็บไซต์', 100, true, true, false, false),
  ('silver', 'Silver', 'ลูกค้าที่ได้รับสิทธิ์เพิ่มเติมระดับ Silver', 80, false, true, true, false),
  ('gold', 'Gold', 'ลูกค้าระดับ Gold สำหรับคอร์สหรือสิทธิ์พิเศษ', 60, false, true, true, false),
  ('vip', 'VIP', 'ลูกค้าระดับ VIP', 40, false, true, true, false),
  ('admin', 'Admin', 'ผู้ดูแลระบบ M&B', 1, false, true, true, true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  priority = excluded.priority,
  is_default = excluded.is_default,
  can_access_courses = excluded.can_access_courses,
  can_access_premium_courses = excluded.can_access_premium_courses,
  can_access_admin = excluded.can_access_admin,
  updated_at = now();

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

create or replace function public.assign_default_customer_level()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_level_id uuid;
begin
  select id
  into default_level_id
  from public.customer_levels
  where is_default = true
  order by priority asc
  limit 1;

  if default_level_id is not null then
    insert into public.customer_level_memberships (
      user_id,
      level_id,
      status,
      assigned_at,
      notes
    )
    values (
      new.id,
      default_level_id,
      'active',
      now(),
      'Auto assigned default customer level'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists assign_default_customer_level_on_signup on auth.users;
create trigger assign_default_customer_level_on_signup
after insert on auth.users
for each row
execute function public.assign_default_customer_level();

alter table public.customer_levels enable row level security;
alter table public.customer_level_memberships enable row level security;

drop policy if exists "customer_levels_select_authenticated" on public.customer_levels;
create policy "customer_levels_select_authenticated"
on public.customer_levels
for select
to authenticated
using (true);

drop policy if exists "customer_levels_admin_manage" on public.customer_levels;
create policy "customer_levels_admin_manage"
on public.customer_levels
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

drop policy if exists "customer_level_memberships_select_own_or_admin" on public.customer_level_memberships;
create policy "customer_level_memberships_select_own_or_admin"
on public.customer_level_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_mnb_admin()
);

drop policy if exists "customer_level_memberships_admin_manage" on public.customer_level_memberships;
create policy "customer_level_memberships_admin_manage"
on public.customer_level_memberships
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

comment on table public.customer_levels is 'ระดับลูกค้าของสมาชิกเว็บไซต์ M&B';
comment on table public.customer_level_memberships is 'ตารางผูก user ที่สมัครสมาชิกกับระดับลูกค้า';
