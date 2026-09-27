-- Léon — stockage « documents » de l'app v11 (legacy/)
-- L'app v11 range ses données en documents JSON adressés par un chemin
-- (net/config, restos/<id>, restos/<id>/data/planning, restos/<id>/pointages/<date>…).
-- Cette table les accueille, un espace par organisation, en attendant de
-- porter chaque module vers des tables dédiées.

create table leon_docs (
  org_id uuid not null references orgs(id) on delete cascade,
  path text not null,
  parent text generated always as (regexp_replace(path, '/[^/]+$', '')) stored,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  primary key (org_id, path)
);

create index on leon_docs (org_id, parent);

create or replace function leon_docs_touch() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create trigger leon_docs_touch before update on leon_docs
  for each row execute function leon_docs_touch();

-- Membre d'une organisation : son créateur, ou toute personne ayant un accès
-- à l'un de ses restaurants.
create or replace function is_org_member(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from orgs o where o.id = o_id and o.owner_user_id = auth.uid())
      or exists (
        select 1 from memberships m join restaurants r on r.id = m.restaurant_id
        where r.org_id = o_id and m.user_id = auth.uid()
      );
$$;

revoke execute on function is_org_member(uuid) from public;
revoke execute on function is_org_member(uuid) from anon;
grant execute on function is_org_member(uuid) to authenticated;

alter table leon_docs enable row level security;

create policy "leon_docs: org members" on leon_docs
  for all to authenticated
  using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Organisation du compte connecté (créée au premier passage).
create or replace function my_org()
returns uuid language plpgsql security definer
set search_path = public, pg_temp as $$
declare o uuid;
begin
  if auth.uid() is null then
    raise exception 'non connecté';
  end if;
  select id into o from orgs where owner_user_id = auth.uid() order by created_at limit 1;
  if o is null then
    select r.org_id into o from memberships m join restaurants r on r.id = m.restaurant_id
      where m.user_id = auth.uid() order by m.created_at limit 1;
  end if;
  if o is null then
    insert into orgs (name, owner_user_id)
      values (coalesce((select email from auth.users where id = auth.uid()), 'Mon organisation'), auth.uid())
      returning id into o;
  end if;
  return o;
end $$;

revoke execute on function my_org() from public;
revoke execute on function my_org() from anon;
grant execute on function my_org() to authenticated;

-- Temps réel : les autres appareils du restaurant voient les changements.
alter publication supabase_realtime add table leon_docs;
