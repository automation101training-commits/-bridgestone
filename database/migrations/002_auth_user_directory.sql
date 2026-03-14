create table if not exists public.auth_user_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  provider text,
  provider_type text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists auth_user_directory_email_idx
on public.auth_user_directory (email);

drop trigger if exists set_auth_user_directory_updated_at on public.auth_user_directory;
create trigger set_auth_user_directory_updated_at
before update on public.auth_user_directory
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.resolve_auth_user_display_name(meta jsonb, fallback_email text, fallback_user_id uuid)
returns text
language sql
stable
as $$
  select coalesce(
    nullif(trim(
      concat_ws(
        ' ',
        coalesce(meta ->> 'first_name', ''),
        coalesce(meta ->> 'last_name', '')
      )
    ), ''),
    nullif(trim(coalesce(meta ->> 'full_name', '')), ''),
    nullif(trim(coalesce(meta ->> 'display_name', '')), ''),
    nullif(trim(coalesce(meta ->> 'displayName', '')), ''),
    nullif(trim(coalesce(meta ->> 'name', '')), ''),
    nullif(trim(coalesce(meta ->> 'username', '')), ''),
    nullif(split_part(coalesce(fallback_email, ''), '@', 1), ''),
    nullif(trim(coalesce(fallback_email, '')), ''),
    fallback_user_id::text,
    'ลูกค้า'
  );
$$;

create or replace function public.sync_auth_user_directory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_value text;
  provider_type_value text;
  meta jsonb;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  provider_value := coalesce(new.raw_app_meta_data ->> 'provider', '');
  provider_type_value := provider_value;

  insert into public.auth_user_directory (
    user_id,
    email,
    display_name,
    provider,
    provider_type,
    created_at,
    last_sign_in_at,
    raw_user_meta_data,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    public.resolve_auth_user_display_name(meta, new.email, new.id),
    nullif(provider_value, ''),
    nullif(provider_type_value, ''),
    new.created_at,
    new.last_sign_in_at,
    meta,
    now()
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    provider = excluded.provider,
    provider_type = excluded.provider_type,
    created_at = excluded.created_at,
    last_sign_in_at = excluded.last_sign_in_at,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_auth_user_directory_on_auth_users on auth.users;
create trigger sync_auth_user_directory_on_auth_users
after insert or update on auth.users
for each row
execute function public.sync_auth_user_directory();

insert into public.auth_user_directory (
  user_id,
  email,
  display_name,
  provider,
  provider_type,
  created_at,
  last_sign_in_at,
  raw_user_meta_data,
  updated_at
)
select
  u.id,
  coalesce(u.email, ''),
  public.resolve_auth_user_display_name(coalesce(u.raw_user_meta_data, '{}'::jsonb), u.email, u.id),
  nullif(coalesce(u.raw_app_meta_data ->> 'provider', ''), ''),
  nullif(coalesce(u.raw_app_meta_data ->> 'provider', ''), ''),
  u.created_at,
  u.last_sign_in_at,
  coalesce(u.raw_user_meta_data, '{}'::jsonb),
  now()
from auth.users u
on conflict (user_id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  provider = excluded.provider,
  provider_type = excluded.provider_type,
  created_at = excluded.created_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'is_mnb_admin'
      and pg_function_is_visible(oid)
  ) then
    execute $fn$
      create function public.is_mnb_admin()
      returns boolean
      language plpgsql
      stable
      security definer
      set search_path = public
      as $body$
        begin
          return
            coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
            or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
            or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin') in ('true', '1'), false)
            or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin') in ('true', '1'), false);
        end;
      $body$;
    $fn$;
  end if;
end
$$;

alter table public.auth_user_directory enable row level security;

drop policy if exists "auth_user_directory_admin_select" on public.auth_user_directory;
create policy "auth_user_directory_admin_select"
on public.auth_user_directory
for select
to authenticated
using (public.is_mnb_admin());

drop policy if exists "auth_user_directory_admin_manage" on public.auth_user_directory;
create policy "auth_user_directory_admin_manage"
on public.auth_user_directory
for all
to authenticated
using (public.is_mnb_admin())
with check (public.is_mnb_admin());

comment on table public.auth_user_directory is 'Mirror of Supabase Authentication > Users for admin screens';
