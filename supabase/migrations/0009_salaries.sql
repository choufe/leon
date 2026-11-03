-- Léon 12.18 — les salariés ont leur compte (téléphone ou PC, même Léon).
-- Décidé avec Maurice le 3 nov. 2026 :
--  * le patron invite un salarié depuis « Salariés & accès » : Léon fait un lien à envoyer par SMS / WhatsApp ;
--  * le salarié ouvre le lien, crée son compte (e-mail + mot de passe) et il est rattaché au resto ;
--  * pas de code à 4 chiffres sur son téléphone : le code, c'est pour la tablette du resto.
create extension if not exists pgcrypto;

-- Lien compte ↔ salarié du resto (emp_id = l'identifiant du salarié dans Léon).
create table if not exists leon_salaries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  emp_id text not null,
  created_at timestamptz not null default now(),
  unique (org_id, emp_id)
);
alter table leon_salaries enable row level security;

-- Invitations (un lien par salarié ; une nouvelle invitation remplace l'ancienne).
create table if not exists leon_invitations (
  code text primary key,
  org_id uuid not null references orgs(id) on delete cascade,
  emp_id text not null,
  prenom text,
  cree_par uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expire_le timestamptz not null default now() + interval '14 days',
  utilise_par uuid references auth.users(id) on delete set null,
  utilise_le timestamptz
);
alter table leon_invitations enable row level security;
create index if not exists leon_invitations_emp on leon_invitations (org_id, emp_id);

-- Le patron (propriétaire du resto) crée le lien d'un salarié.
create or replace function inviter_salarie(e_id text, e_prenom text) returns text
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare o uuid; c text;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select id into o from orgs where owner_user_id = auth.uid() order by created_at limit 1;
  if o is null then raise exception 'réservé au patron'; end if;
  if coalesce(e_id, '') = '' then raise exception 'salarié manquant'; end if;
  delete from leon_invitations where org_id = o and emp_id = e_id and utilise_le is null;
  c := lower(substr(replace(encode(gen_random_bytes(9), 'base64'), '/', ''), 1, 10));
  c := regexp_replace(c, '[^a-z0-9]', 'x', 'g');
  insert into leon_invitations (code, org_id, emp_id, prenom, cree_par) values (c, o, e_id, left(e_prenom, 60), auth.uid());
  return c;
end $$;

-- Ce qu'affiche la page « Rejoindre » avant de créer le compte (rien de sensible).
create or replace function invitation_infos(c text) returns jsonb
language sql security definer stable set search_path = public, extensions, pg_temp as $$
  select jsonb_build_object('prenom', i.prenom, 'resto', o.name, 'valide', i.utilise_le is null and i.expire_le > now())
  from leon_invitations i join orgs o on o.id = i.org_id where i.code = lower(c);
$$;

-- Le salarié connecté accepte l'invitation : son compte est rattaché au resto.
create or replace function rejoindre(c text) returns boolean
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare i leon_invitations;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select * into i from leon_invitations where code = lower(c) for update;
  if not found or i.utilise_le is not null or i.expire_le < now() then return false; end if;
  if exists (select 1 from orgs where owner_user_id = auth.uid()) then raise exception 'ce compte est déjà celui d''un patron'; end if;
  delete from leon_salaries where org_id = i.org_id and emp_id = i.emp_id;
  insert into leon_salaries (user_id, org_id, emp_id) values (auth.uid(), i.org_id, i.emp_id)
    on conflict (user_id) do update set org_id = excluded.org_id, emp_id = excluded.emp_id, created_at = now();
  update leon_invitations set utilise_par = auth.uid(), utilise_le = now() where code = i.code;
  return true;
end $$;

-- Pour l'appli : ce compte est-il un salarié ? (resto, prénom, identifiant du salarié)
create or replace function mon_salarie() returns jsonb
language sql security definer stable set search_path = public, extensions, pg_temp as $$
  select jsonb_build_object('emp_id', s.emp_id, 'resto', o.name, 'org_id', o.id)
  from leon_salaries s join orgs o on o.id = s.org_id where s.user_id = auth.uid();
$$;

-- Le patron voit qui a rejoint (pour afficher « connecté » à côté du salarié).
create or replace function mes_salaries_connectes() returns table (emp_id text, depuis timestamptz)
language sql security definer stable set search_path = public, extensions, pg_temp as $$
  select s.emp_id, s.created_at from leon_salaries s join orgs o on o.id = s.org_id where o.owner_user_id = auth.uid();
$$;

-- Un salarié rattaché est membre de l'organisation (il lit le Léon de son resto).
create or replace function is_org_member(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from orgs o where o.id = o_id and o.owner_user_id = auth.uid())
      or exists (
        select 1 from memberships m join restaurants r on r.id = m.restaurant_id
        where r.org_id = o_id and m.user_id = auth.uid()
      )
      or exists (select 1 from leon_salaries s where s.org_id = o_id and s.user_id = auth.uid());
$$;

-- Organisation du compte connecté : un salarié tombe sur son resto (on ne lui en crée pas un).
create or replace function my_org()
returns uuid language plpgsql security definer
set search_path = public, pg_temp as $$
declare o uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
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

do $$
declare f text;
begin
  foreach f in array array['inviter_salarie(text,text)','rejoindre(text)','mon_salarie()','mes_salaries_connectes()','my_org()','is_org_member(uuid)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke execute on function invitation_infos(text) from public;
grant execute on function invitation_infos(text) to anon, authenticated;
