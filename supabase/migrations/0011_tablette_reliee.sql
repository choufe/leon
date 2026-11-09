-- 14.06 · Relier la tablette du resto par un lien perso (validé par Maurice le 9 nov.)
-- Avant : la tablette était connectée avec le compte du patron (e-mail + mot de passe).
-- Maintenant : le patron touche « Relier une tablette » → un lien valable 30 minutes, une seule fois.
-- Ouvert sur la tablette, il lui crée son propre compte « tablette », rattaché à ce resto seulement.
-- La tablette ne peut ouvrir que /tablette (l'écran des codes), jamais l'appli du patron.

create table if not exists leon_tablettes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  nom text,
  cree_le timestamptz not null default now(),
  cree_par uuid references auth.users(id) on delete set null,
  vue_le timestamptz
);
alter table leon_tablettes enable row level security;

create table if not exists leon_tablette_liens (
  code text primary key,
  org_id uuid not null references orgs(id) on delete cascade,
  cree_par uuid references auth.users(id) on delete set null,
  expire timestamptz not null,
  utilise_le timestamptz
);
alter table leon_tablette_liens enable row level security;

-- La tablette fait partie de la « direction » de son resto pour les documents
-- (badgeuse, hygiène, réceptions, inventaire) ; l'écran limité, c'est l'appli qui le garantit.
create or replace function est_direction(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from orgs o where o.id = o_id and o.owner_user_id = auth.uid())
      or exists (
        select 1 from memberships m join restaurants r on r.id = m.restaurant_id
        where r.org_id = o_id and m.user_id = auth.uid()
      )
      or exists (select 1 from leon_tablettes t where t.org_id = o_id and t.user_id = auth.uid());
$$;

create or replace function suis_tablette()
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from leon_tablettes where user_id = auth.uid());
$$;

-- Le resto du compte : la tablette d'abord (elle ne doit jamais créer d'organisation)
create or replace function my_org()
returns uuid language plpgsql security definer
set search_path = public, pg_temp as $$
declare o uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select org_id into o from leon_tablettes where user_id = auth.uid();
  if o is not null then
    update leon_tablettes set vue_le = now() where user_id = auth.uid();
    return o;
  end if;
  select id into o from orgs where owner_user_id = auth.uid() order by created_at limit 1;
  if o is null then select org_id into o from leon_salaries where user_id = auth.uid(); end if;
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

create or replace function mon_accueil() returns jsonb
language sql security definer stable set search_path = public, extensions, pg_temp as $$
  select coalesce(
    (select jsonb_build_object('prenom', patron_prenom, 'resto', name, 'ferme', supprime_le is not null)
       from orgs where owner_user_id = auth.uid() order by created_at limit 1),
    (select jsonb_build_object('prenom', '', 'resto', o.name, 'ferme', o.supprime_le is not null, 'tablette', true)
       from leon_tablettes t join orgs o on o.id = t.org_id where t.user_id = auth.uid())
  );
$$;

-- Le patron (ou le créateur pendant l'aide) fait un lien pour relier une tablette.
create or replace function creer_lien_tablette(o_id uuid default null)
returns text language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare o uuid := coalesce(o_id, my_org()); c text;
begin
  if suis_tablette() then raise exception 'pas depuis une tablette'; end if;
  if not (exists (select 1 from orgs where id = o and owner_user_id = auth.uid())
          or exists (select 1 from memberships m join restaurants r on r.id = m.restaurant_id where r.org_id = o and m.user_id = auth.uid())
          or createur_peut_aider(o)) then
    raise exception 'réservé à la direction du resto';
  end if;
  c := encode(gen_random_bytes(18), 'hex');
  insert into leon_tablette_liens (code, org_id, cree_par, expire) values (c, o, auth.uid(), now() + interval '30 minutes');
  return c;
end $$;

-- Les tablettes reliées (pour les voir et en délier une)
create or replace function mes_tablettes(o_id uuid default null)
returns table (user_id uuid, nom text, cree_le timestamptz, vue_le timestamptz)
language plpgsql security definer stable
set search_path = public, pg_temp as $$
declare o uuid := coalesce(o_id, (select id from orgs where owner_user_id = auth.uid() order by created_at limit 1));
begin
  if not (exists (select 1 from orgs where id = o and owner_user_id = auth.uid()) or createur_peut_aider(o)) then return; end if;
  return query select t.user_id, t.nom, t.cree_le, t.vue_le from leon_tablettes t where t.org_id = o order by t.cree_le;
end $$;

create or replace function delier_tablette(u uuid)
returns boolean language plpgsql security definer
set search_path = public, pg_temp as $$
declare o uuid;
begin
  select org_id into o from leon_tablettes where user_id = u;
  if o is null then return false; end if;
  if not (exists (select 1 from orgs where id = o and owner_user_id = auth.uid()) or createur_peut_aider(o)) then
    raise exception 'réservé au patron';
  end if;
  delete from leon_tablettes where user_id = u;
  return true;
end $$;

do $$
declare f text;
begin
  foreach f in array array['suis_tablette()','creer_lien_tablette(uuid)','mes_tablettes(uuid)','delier_tablette(uuid)','est_direction(uuid)','my_org()','mon_accueil()'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
