create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin
  create type appointment_status as enum ('pending','confirmed','canceled','completed','no_show');
exception when duplicate_object then null; end $$;

create table if not exists public.masters (
  id uuid primary key default gen_random_uuid(),
  tg_user_id bigint not null unique,
  display_name text not null,
  city text,
  bio text,
  timezone text not null default 'Europe/Moscow',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.masters(id) on delete cascade,
  title text not null,
  duration_min integer not null check (duration_min between 10 and 480),
  price_rub integer not null check (price_rub >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists services_master_id_idx on public.services(master_id);

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.masters(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  unique(master_id, weekday, start_time, end_time),
  check (start_time < end_time)
);
create index if not exists working_hours_master_id_idx on public.working_hours(master_id);

create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.masters(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (start_at < end_at)
);
create index if not exists time_off_master_id_idx on public.time_off(master_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  tg_user_id bigint not null unique,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.masters(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  client_tg_user_id bigint not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status appointment_status not null default 'confirmed',
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at)
);
create index if not exists appointments_master_start_idx on public.appointments(master_id, start_at);
create index if not exists appointments_client_tg_idx on public.appointments(client_tg_user_id, start_at);

do $$ begin
  alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    master_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (status in ('pending','confirmed'));
exception when duplicate_object then null; end $$;

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.masters(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(master_id, client_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ begin
  create trigger masters_set_updated_at before update on public.masters
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger services_set_updated_at before update on public.services
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger appointments_set_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger client_notes_set_updated_at before update on public.client_notes
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

alter table public.masters enable row level security;
alter table public.services enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.client_notes enable row level security;

revoke all on all tables in schema public from anon, authenticated;
