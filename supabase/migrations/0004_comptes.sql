-- Léon 11.08 — comptes : créateur (Maurice), restos invités, codes à 4 chiffres.
-- Principes (décidés avec Maurice le 30-31 oct. 2026) :
--  * personne ne s'inscrit tout seul : le créateur crée le resto et invite le patron ;
--  * le créateur se connecte avec mot de passe PUIS un 2e code à 4 chiffres ;
--  * le patron rouvre l'appli avec son code à 4 chiffres ;
--  * 5 mauvais codes → attente de 30 s, qui double si ça continue, sans prévenir personne ;
--  * le créateur garde un accès d'aide de 15 jours sur chaque resto qu'il lance.
create extension if not exists pgcrypto;

-- Infos du resto vues par le créateur.
alter table orgs
  add column if not exists ville text,
  add column if not exists kind text not null default 'restaurant',
  add column if not exists patron_prenom text,
  add column if not exists patron_email text,
  add column if not exists statut text not null default 'actif',
  add column if not exists invite_le timestamptz,
  add column if not exists aide_jusqu timestamptz;

-- Comptes créateur (pas de lecture directe : tout passe par les fonctions).
create table if not exists leon_createurs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text,
  pin_ok_jusqu timestamptz,
  echecs int not null default 0,
  bloque_jusqu timestamptz,
  created_at timestamptz not null default now()
);
alter table leon_createurs enable row level security;

-- Code à 4 chiffres des comptes patron / directeur.
create table if not exists leon_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  echecs int not null default 0,
  bloque_jusqu timestamptz,
  updated_at timestamptz not null default now()
);
alter table leon_codes enable row level security;

-- ---------- Créateur ----------

-- Le compte connecté est un créateur (sans vérifier le 2e code) : sert à aiguiller.
create or replace function suis_createur() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists (select 1 from leon_createurs where user_id = auth.uid());
$$;

-- Créateur ET 2e code validé récemment : c'est ce qui ouvre les droits.
create or replace function est_createur() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists (select 1 from leon_createurs where user_id = auth.uid() and pin_ok_jusqu > now());
$$;

-- Premier compte créateur : seulement tant qu'il n'y en a aucun.
create or replace function devenir_createur() returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if exists (select 1 from leon_createurs) then
    return exists (select 1 from leon_createurs where user_id = auth.uid());
  end if;
  insert into leon_createurs (user_id) values (auth.uid());
  return true;
end $$;

-- État du 2e code : 'aucun' (à choisir), 'a_verifier', 'ok'. null si pas créateur.
create or replace function createur_etat() returns text
language sql security definer stable set search_path = public, pg_temp as $$
  select case when pin_hash is null then 'aucun' when pin_ok_jusqu > now() then 'ok' else 'a_verifier' end
  from leon_createurs where user_id = auth.uid();
$$;

create or replace function createur_definir_code(pin text) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if pin !~ '^[0-9]{4}$' then raise exception 'code à 4 chiffres'; end if;
  update leon_createurs set pin_hash = crypt(pin, gen_salt('bf')), pin_ok_jusqu = now() + interval '12 hours', echecs = 0, bloque_jusqu = null
    where user_id = auth.uid() and pin_hash is null;
  return found;
end $$;

-- Renvoie {ok, attente} : attente = secondes à patienter si trop d'erreurs.
create or replace function createur_verifier_code(pin text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare c leon_createurs;
begin
  select * into c from leon_createurs where user_id = auth.uid() for update;
  if not found or c.pin_hash is null then return jsonb_build_object('ok', false, 'attente', 0); end if;
  if c.bloque_jusqu > now() then
    return jsonb_build_object('ok', false, 'attente', ceil(extract(epoch from c.bloque_jusqu - now())));
  end if;
  if c.pin_hash = crypt(coalesce(pin, ''), c.pin_hash) then
    update leon_createurs set echecs = 0, bloque_jusqu = null, pin_ok_jusqu = now() + interval '12 hours' where user_id = auth.uid();
    return jsonb_build_object('ok', true, 'attente', 0);
  end if;
  c.echecs := c.echecs + 1;
  update leon_createurs set echecs = c.echecs,
    bloque_jusqu = case when c.echecs >= 5 then now() + make_interval(secs => 30 * power(2, least(c.echecs - 5, 7))) end
    where user_id = auth.uid();
  return jsonb_build_object('ok', false, 'attente', case when c.echecs >= 5 then 30 * power(2, least(c.echecs - 5, 7)) else 0 end);
end $$;

-- Liste des restos pour la page créateur.
create or replace function createur_restos()
returns table (id uuid, nom text, ville text, kind text, patron_prenom text, patron_email text, statut text, invite_le timestamptz, aide_jusqu timestamptz, created_at timestamptz, a_moi boolean)
language plpgsql security definer stable set search_path = public, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  return query
    select o.id, o.name, o.ville, o.kind, o.patron_prenom, o.patron_email, o.statut, o.invite_le, o.aide_jusqu, o.created_at, o.owner_user_id = auth.uid()
    from orgs o order by o.created_at desc;
end $$;

-- Accès d'aide : le créateur (2e code validé) peut travailler dans un resto pendant son aide.
create or replace function createur_peut_aider(o_id uuid) returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select est_createur() and exists (select 1 from orgs where id = o_id and aide_jusqu > now());
$$;

drop policy if exists "leon_docs: aide du créateur" on leon_docs;
create policy "leon_docs: aide du créateur" on leon_docs
  for all to authenticated
  using (createur_peut_aider(org_id)) with check (createur_peut_aider(org_id));

-- ---------- Patron / directeur ----------

create or replace function mon_code_existe() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists (select 1 from leon_codes where user_id = auth.uid());
$$;

-- Choisir son code (une seule fois ; pour le changer, on passera par le mot de passe).
create or replace function definir_mon_code(pin text) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if pin !~ '^[0-9]{4}$' then raise exception 'code à 4 chiffres'; end if;
  insert into leon_codes (user_id, pin_hash) values (auth.uid(), crypt(pin, gen_salt('bf')))
    on conflict (user_id) do nothing;
  return found;
end $$;

create or replace function verifier_mon_code(pin text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare c leon_codes;
begin
  select * into c from leon_codes where user_id = auth.uid() for update;
  if not found then return jsonb_build_object('ok', false, 'attente', 0); end if;
  if c.bloque_jusqu > now() then
    return jsonb_build_object('ok', false, 'attente', ceil(extract(epoch from c.bloque_jusqu - now())));
  end if;
  if c.pin_hash = crypt(coalesce(pin, ''), c.pin_hash) then
    update leon_codes set echecs = 0, bloque_jusqu = null where user_id = auth.uid();
    return jsonb_build_object('ok', true, 'attente', 0);
  end if;
  c.echecs := c.echecs + 1;
  update leon_codes set echecs = c.echecs,
    bloque_jusqu = case when c.echecs >= 5 then now() + make_interval(secs => 30 * power(2, least(c.echecs - 5, 7))) end
    where user_id = auth.uid();
  return jsonb_build_object('ok', false, 'attente', case when c.echecs >= 5 then 30 * power(2, least(c.echecs - 5, 7)) else 0 end);
end $$;

-- Le patron a fini sa première connexion : son resto passe de « Invité » à « Actif ».
create or replace function marquer_actif() returns void
language sql security definer set search_path = public, pg_temp as $$
  update orgs set statut = 'actif' where owner_user_id = auth.uid() and statut = 'invite';
$$;

-- Infos de bienvenue (prénom du patron, nom du resto).
create or replace function mon_accueil() returns jsonb
language sql security definer stable set search_path = public, pg_temp as $$
  select jsonb_build_object('prenom', patron_prenom, 'resto', name)
  from orgs where owner_user_id = auth.uid() order by created_at limit 1;
$$;

-- Droits : seulement les comptes connectés.
do $$
declare f text;
begin
  foreach f in array array['suis_createur()','est_createur()','devenir_createur()','createur_etat()','createur_definir_code(text)',
    'createur_verifier_code(text)','createur_restos()','createur_peut_aider(uuid)','mon_code_existe()','definir_mon_code(text)',
    'verifier_mon_code(text)','marquer_actif()','mon_accueil()'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
