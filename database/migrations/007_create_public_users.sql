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

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_role_check check (role in ('user', 'admin')),
  constraint users_username_format check (
    username is null
    or username ~ '^[A-Za-z0-9_.-]{3,64}$'
  )
);

create index if not exists users_email_idx
on public.users (lower(email));

create index if not exists users_username_idx
on public.users (lower(username))
where username is not null;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.users disable row level security;

insert into public.users (
  username,
  full_name,
  email,
  password_hash,
  role,
  active
)
values (
  'admin',
  'Administrator',
  'admin@example.com',
  'admin',
  'admin',
  true
)
on conflict (email) do update
set
  username = coalesce(public.users.username, excluded.username),
  full_name = coalesce(nullif(public.users.full_name, ''), excluded.full_name),
  password_hash = excluded.password_hash,
  role = case when public.users.role = 'admin' then public.users.role else excluded.role end,
  active = true,
  updated_at = now();

grant select, insert, update, delete on public.users to anon, authenticated;

comment on table public.users is 'Custom application users used by the local login flow';
