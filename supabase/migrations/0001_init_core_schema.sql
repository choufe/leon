-- Léon — schéma de base (v0.1) : organisation, restaurants, salariés, planning, pointage
create extension if not exists pgcrypto;

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  nom text not null,
  type text default 'brasserie',
  ville text,
  timezone text not null default 'Europe/Paris',
  closed_days smallint[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  role text not null check (role in ('admin','patron','manager')),
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  prenom text not null,
  nom text default '',
  titre text,
  poste text not null default 'salle',
  contrat numeric not null default 35,
  taux numeric,
  tel text,
  pin_hash text,
  acces text not null default 'staff' check (acces in ('staff','manager')),
  perms jsonb not null default '{}'::jsonb,
  lang text not null default 'fr',
  skills text[] not null default '{}',
  docs jsonb not null default '{}'::jsonb,
  cp_solde numeric,
  cp_au date,
  entree date,
  type_contrat text default 'cdi',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table shift_types (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  label text not null,
  poste text not null,
  segments jsonb not null default '[]'::jsonb
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  pause_min smallint not null default 0,
  poste text not null,
  created_at timestamptz not null default now()
);

create table absences (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);

create table time_clock_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  ts timestamptz not null default now(),
  type text not null check (type in ('in','out','pause','back')),
  source text default 'borne'
);

create index on restaurants (org_id);
create index on memberships (restaurant_id);
create index on employees (restaurant_id);
create index on shifts (restaurant_id, date);
create index on absences (restaurant_id, date);
create index on time_clock_events (restaurant_id, employee_id, ts);

alter table orgs enable row level security;
alter table restaurants enable row level security;
alter table memberships enable row level security;
alter table employees enable row level security;
alter table shift_types enable row level security;
alter table shifts enable row level security;
alter table absences enable row level security;
alter table time_clock_events enable row level security;

create or replace function is_member_of(r_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (
    select 1 from memberships m where m.restaurant_id = r_id and m.user_id = auth.uid()
  );
$$;

revoke execute on function is_member_of(uuid) from public;
revoke execute on function is_member_of(uuid) from anon;
grant execute on function is_member_of(uuid) to authenticated;

create policy "orgs: owner only" on orgs
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "restaurants: members" on restaurants
  for all using (is_member_of(id)) with check (is_member_of(id));

create policy "memberships: self read" on memberships
  for select using (user_id = auth.uid());

create policy "employees: members" on employees
  for all using (is_member_of(restaurant_id)) with check (is_member_of(restaurant_id));

create policy "shift_types: members" on shift_types
  for all using (is_member_of(restaurant_id)) with check (is_member_of(restaurant_id));

create policy "shifts: members" on shifts
  for all using (is_member_of(restaurant_id)) with check (is_member_of(restaurant_id));

create policy "absences: members" on absences
  for all using (is_member_of(restaurant_id)) with check (is_member_of(restaurant_id));

create policy "time_clock_events: members" on time_clock_events
  for all using (is_member_of(restaurant_id)) with check (is_member_of(restaurant_id));
