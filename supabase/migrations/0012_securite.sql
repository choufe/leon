-- 15.00 · Sécurité (audit du 11 nov. 2026, voir AUDIT.md : S1, S2, S3, S5, S6, S10).
-- Rien n'est supprimé : uniquement des fonctions, des règles et des droits.
--  S1  my_org() ne crée plus jamais d'organisation (personne ne s'ouvre un Léon tout seul).
--  S3  un resto supprimé est fermé aussi dans la base (patron, salariés, tablette).
--  S5  un salarié ne peut plus toucher à la validation des heures / de la paie.
--  S2  l'assistant (leon-ia) : réservé aux comptes d'un resto actif, avec un compteur par jour.
--  S10 demandes de démo : frein contre les robots.
--  S6  droits sur les tables réduits au strict nécessaire.

-- ---------- S3 · resto supprimé = fermé ----------
create or replace function est_direction(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from orgs o where o.id = o_id and o.supprime_le is null and (
           o.owner_user_id = auth.uid()
        or exists (select 1 from memberships m join restaurants r on r.id = m.restaurant_id
                   where r.org_id = o.id and m.user_id = auth.uid())
        or exists (select 1 from leon_tablettes t where t.org_id = o.id and t.user_id = auth.uid())
      ));
$$;

create or replace function est_salarie_de(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from leon_salaries s join orgs o on o.id = s.org_id
                 where s.org_id = o_id and s.user_id = auth.uid() and o.supprime_le is null);
$$;

create or replace function is_org_member(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select est_direction(o_id) or est_salarie_de(o_id);
$$;

-- ---------- S1 · my_org() ne crée plus rien ----------
-- Renvoie le resto du compte (tablette, patron, salarié, membre) ou NULL : l'appli affiche alors
-- « ce compte n'est relié à aucun restaurant ». Les restos naissent uniquement dans l'espace créateur.
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
  -- le resto actif d'abord : un vieux resto supprimé ne doit pas cacher le bon
  select id into o from orgs where owner_user_id = auth.uid() order by (supprime_le is not null), created_at limit 1;
  if o is null then select org_id into o from leon_salaries where user_id = auth.uid(); end if;
  if o is null then
    select r.org_id into o from memberships m join restaurants r on r.id = m.restaurant_id
      where m.user_id = auth.uid() order by m.created_at limit 1;
  end if;
  return o;
end $$;

create or replace function mon_accueil() returns jsonb
language sql security definer stable set search_path = public, extensions, pg_temp as $$
  select coalesce(
    (select jsonb_build_object('prenom', patron_prenom, 'resto', name, 'ferme', supprime_le is not null)
       from orgs where owner_user_id = auth.uid() order by (supprime_le is not null), created_at limit 1),
    (select jsonb_build_object('prenom', '', 'resto', o.name, 'ferme', o.supprime_le is not null, 'tablette', true)
       from leon_tablettes t join orgs o on o.id = t.org_id where t.user_id = auth.uid())
  );
$$;

-- On ne rejoint pas un resto supprimé.
create or replace function rejoindre(c text) returns boolean
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare i leon_invitations;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select * into i from leon_invitations where code = lower(c) for update;
  if not found or i.utilise_le is not null or i.expire_le < now() then return false; end if;
  if exists (select 1 from orgs where id = i.org_id and supprime_le is not null) then return false; end if;
  if exists (select 1 from orgs where owner_user_id = auth.uid()) then raise exception 'ce compte est déjà celui d''un patron'; end if;
  delete from leon_salaries where org_id = i.org_id and emp_id = i.emp_id;
  insert into leon_salaries (user_id, org_id, emp_id) values (auth.uid(), i.org_id, i.emp_id)
    on conflict (user_id) do update set org_id = excluded.org_id, emp_id = excluded.emp_id, created_at = now();
  update leon_invitations set utilise_par = auth.uid(), utilise_le = now() where code = i.code;
  return true;
end $$;

-- ---------- S5 · le salarié ne touche pas aux validations ----------
-- Dans « équipe » : validated / paieVal (heures et paie validées). Dans « ops » : priceLog (historique des prix).
-- Quand c'est un salarié qui écrit, ces rubriques gardent leur valeur d'avant, quoi qu'il envoie.
create or replace function leon_docs_garde_salarie()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
declare cles text[]; k text;
begin
  if new.path ~ '^restos/[^/]+/data/equipe$' then cles := array['validated', 'paieVal'];
  elsif new.path ~ '^restos/[^/]+/data/ops$' then cles := array['priceLog'];
  else return new; end if;
  if auth.uid() is null or est_direction(new.org_id) or createur_peut_aider(new.org_id) then return new; end if;
  if jsonb_typeof(new.data) <> 'object' then
    if tg_op = 'UPDATE' then new.data := old.data; else new.data := '{}'::jsonb; end if;
    return new;
  end if;
  foreach k in array cles loop
    if tg_op = 'UPDATE' and old.data ? k then new.data := jsonb_set(new.data, array[k], old.data -> k);
    else new.data := new.data - k; end if;
  end loop;
  return new;
end $$;

drop trigger if exists leon_docs_garde_salarie on leon_docs;
create trigger leon_docs_garde_salarie before insert or update on leon_docs
  for each row execute function leon_docs_garde_salarie();

-- ---------- S2 · l'assistant : un compteur par jour ----------
create table if not exists leon_ia_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  jour date not null default current_date,
  org_id uuid not null references orgs(id) on delete cascade,
  n int not null default 0,
  primary key (user_id, jour)
);
alter table leon_ia_usage enable row level security;
create index if not exists leon_ia_usage_org on leon_ia_usage (org_id, jour);

-- Appelée par la fonction serveur leon-ia avant chaque question.
-- Renvoie {ok:true} ou {ok:false, raison:'pas_de_resto' | 'limite'}.
create or replace function leon_ia_ticket(o_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare o uuid := coalesce(o_id, my_org()); moi int; tous int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'raison', 'non_connecte'); end if;
  if o is null or not (est_direction(o) or est_salarie_de(o) or createur_peut_aider(o)) then
    return jsonb_build_object('ok', false, 'raison', 'pas_de_resto');
  end if;
  insert into leon_ia_usage (user_id, jour, org_id, n) values (auth.uid(), current_date, o, 1)
    on conflict (user_id, jour) do update set n = leon_ia_usage.n + 1, org_id = excluded.org_id
    returning n into moi;
  select coalesce(sum(n), 0) into tous from leon_ia_usage where org_id = o and jour = current_date;
  if moi > 60 or tous > 400 then return jsonb_build_object('ok', false, 'raison', 'limite'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function leon_ia_ticket(uuid) from public, anon;
grant execute on function leon_ia_ticket(uuid) to authenticated;

-- ---------- S10 · demandes de démo : frein contre les robots ----------
create or replace function demandes_frein() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from demandes where created_at > now() - interval '1 hour') >= 40 then
    raise exception 'trop de demandes, réessayez dans une heure';
  end if;
  return new;
end $$;
drop trigger if exists demandes_frein on demandes;
create trigger demandes_frein before insert on demandes
  for each row execute function demandes_frein();

-- ---------- S6 · droits réduits au strict nécessaire ----------
-- Visiteur (anon) : seulement envoyer une demande de démo.
revoke all on all tables in schema public from anon;
grant insert on public.demandes to anon;
-- Comptes connectés : jamais de vidage de table ; les tables de comptes passent uniquement par les fonctions.
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke all on leon_createurs, leon_codes, leon_compta, leon_invitations, leon_salaries,
              leon_tablettes, leon_tablette_liens, leon_ia_usage from authenticated;
revoke select, update, delete on public.demandes from authenticated;
-- Les prochaines tables ne seront pas ouvertes aux visiteurs par défaut.
alter default privileges in schema public revoke all on tables from anon;
-- Fonctions internes (déclencheurs, copie publique) : pas appelables depuis le site.
revoke execute on function leon_doc_public(text, jsonb) from public, anon, authenticated;
revoke execute on function leon_docs_pub() from public, anon, authenticated;
revoke execute on function leon_docs_touch() from public, anon, authenticated;
revoke execute on function leon_docs_garde_salarie() from public, anon, authenticated;
revoke execute on function demandes_frein() from public, anon, authenticated;
-- /inscription n'existe plus : plus besoin de cette question pour un visiteur.
revoke execute on function createur_existe() from anon;
