-- 12.01 · Supprimer un resto depuis l'espace créateur, en toute sécurité.
-- « Supprimer » = mettre de côté : plus personne n'y entre, mais TOUTES les données sont gardées
-- et le créateur peut le récupérer. Il faut retaper son 2e code pour confirmer.
alter table orgs add column if not exists supprime_le timestamptz;
alter table orgs add column if not exists test boolean not null default false;

-- Un resto supprimé n'est plus accessible à son équipe.
create or replace function is_org_member(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from orgs o where o.id = o_id and o.owner_user_id = auth.uid() and o.supprime_le is null)
      or exists (
        select 1 from memberships m join restaurants r on r.id = m.restaurant_id join orgs o on o.id = r.org_id
        where r.org_id = o_id and m.user_id = auth.uid() and o.supprime_le is null
      );
$$;

create or replace function createur_peut_aider(o_id uuid) returns boolean
language sql security definer stable set search_path = public, extensions, pg_temp as $$
  select est_createur() and exists (select 1 from orgs where id = o_id and aide_jusqu > now() and supprime_le is null);
$$;

-- Le patron d'un resto supprimé voit un message clair au lieu d'une erreur.
create or replace function mon_accueil() returns jsonb
language sql security definer stable set search_path = public, extensions, pg_temp as $$
  select jsonb_build_object('prenom', patron_prenom, 'resto', name, 'ferme', supprime_le is not null)
  from orgs where owner_user_id = auth.uid() order by created_at limit 1;
$$;

-- La liste du créateur indique les restos supprimés (affichés à part, récupérables).
drop function if exists createur_restos();
create function createur_restos()
returns table (id uuid, nom text, ville text, kind text, patron_prenom text, patron_email text, statut text, invite_le timestamptz, aide_jusqu timestamptz, created_at timestamptz, a_moi boolean, supprime_le timestamptz, test boolean)
language plpgsql security definer stable set search_path = public, extensions, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  return query
    select o.id, o.name, o.ville, o.kind, o.patron_prenom, o.patron_email, o.statut, o.invite_le, o.aide_jusqu, o.created_at, o.owner_user_id = auth.uid(), o.supprime_le, o.test
    from orgs o order by o.created_at desc;
end $$;

-- Supprimer : il faut le 2e code du créateur (mêmes règles : 5 erreurs → attente).
create or replace function createur_supprimer_resto(o_id uuid, pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v jsonb;
begin
  if not suis_createur() then raise exception 'réservé au créateur'; end if;
  v := createur_verifier_code(pin);
  if not (v->>'ok')::boolean then return v; end if;
  update orgs set supprime_le = now(), aide_jusqu = null where id = o_id and supprime_le is null;
  return jsonb_build_object('ok', found, 'attente', 0);
end $$;

create or replace function createur_recuperer_resto(o_id uuid) returns boolean
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  update orgs set supprime_le = null where id = o_id and supprime_le is not null;
  return found;
end $$;

-- Resto de test : créé par le créateur pour essayer Léon en vrai, sans patron ni mail.
-- C'est le créateur qui en est propriétaire, il y entre quand il veut.
create or replace function createur_creer_test(nom text, ville text, kind text) returns uuid
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare o uuid;
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  if coalesce(trim(nom), '') = '' then raise exception 'nom manquant'; end if;
  insert into orgs (name, ville, kind, owner_user_id, statut, patron_prenom, test, aide_jusqu)
    values (left(trim(nom), 80), nullif(left(trim(coalesce(ville, '')), 60), ''),
            case when kind in ('restaurant','bar','brasserie','boite','rapide','autre') then kind else 'restaurant' end,
            auth.uid(), 'actif', 'Test', true, now() + interval '10 years')
    returning id into o;
  return o;
end $$;

do $$
declare f text;
begin
  foreach f in array array['createur_restos()','createur_supprimer_resto(uuid, text)','createur_recuperer_resto(uuid)','createur_creer_test(text, text, text)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
