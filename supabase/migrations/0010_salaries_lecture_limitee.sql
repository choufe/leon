-- 14.05 · Un salarié connecté ne lit que ce dont il a besoin (validé par Maurice le 9 nov.)
-- Avant : `is_org_member` incluait les salariés, donc un salarié pouvait lire, via l'API,
-- tous les documents de son resto : codes, mot de passe de la tablette, taux horaires, stocks, ventes…
-- Maintenant :
--   * la direction (propriétaire, membres d'un resto, créateur pendant l'aide) garde tout ;
--   * un salarié lit seulement : planning, carte (fiches, allergènes), équipe (congés, échanges),
--     cahier (ops), plats dispo, et une copie « publique » du resto et de net/config
--     (sans codes, mots de passe, taux horaires, téléphones, contrats) ;
--   * un salarié n'écrit que dans : équipe (ses demandes), cahier (ops), plats dispo.
-- Les copies publiques (`restos/<id>/pub`, `net/pub`) sont tenues à jour par un déclencheur.

create or replace function est_direction(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from orgs o where o.id = o_id and o.owner_user_id = auth.uid())
      or exists (
        select 1 from memberships m join restaurants r on r.id = m.restaurant_id
        where r.org_id = o_id and m.user_id = auth.uid()
      );
$$;

create or replace function est_salarie_de(o_id uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from leon_salaries s where s.org_id = o_id and s.user_id = auth.uid());
$$;

revoke execute on function est_direction(uuid) from public, anon;
revoke execute on function est_salarie_de(uuid) from public, anon;
grant execute on function est_direction(uuid) to authenticated;
grant execute on function est_salarie_de(uuid) to authenticated;

-- Copie publique d'un document, sans rien de sensible
create or replace function leon_doc_public(p text, d jsonb)
returns jsonb language sql immutable
set search_path = public, pg_temp as $$
  select case
    when p = 'net/config' then
      (d - 'adminCode' - 'adminPass' - 'adminId')
    when p ~ '^restos/[^/]+$' then
      (d - 'codes' - 'login' - 'charges' - 'caisse')
      || jsonb_build_object('emp', coalesce((
           select jsonb_agg(e - 'code' - 'taux' - 'tel' - 'perso' - 'docs' - 'contrat' - 'typeContrat' - 'perms')
           from jsonb_array_elements(case when jsonb_typeof(d->'emp') = 'array' then d->'emp' else '[]'::jsonb end) e
         ), '[]'::jsonb))
    else d
  end;
$$;

create or replace function leon_docs_pub()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare cible text;
begin
  if tg_op = 'DELETE' then
    if old.path = 'net/config' then cible := 'net/pub';
    elsif old.path ~ '^restos/[^/]+$' then cible := old.path || '/pub';
    else return old; end if;
    delete from leon_docs where org_id = old.org_id and path = cible;
    return old;
  end if;
  if new.path = 'net/config' then cible := 'net/pub';
  elsif new.path ~ '^restos/[^/]+$' then cible := new.path || '/pub';
  else return new; end if;
  insert into leon_docs (org_id, path, data)
    values (new.org_id, cible, leon_doc_public(new.path, new.data))
    on conflict (org_id, path) do update set data = excluded.data;
  return new;
end $$;

drop trigger if exists leon_docs_pub on leon_docs;
create trigger leon_docs_pub after insert or update or delete on leon_docs
  for each row execute function leon_docs_pub();

-- Remplissage des copies publiques existantes
insert into leon_docs (org_id, path, data)
  select org_id, case when path = 'net/config' then 'net/pub' else path || '/pub' end, leon_doc_public(path, data)
  from leon_docs where path = 'net/config' or path ~ '^restos/[^/]+$'
  on conflict (org_id, path) do update set data = excluded.data;

-- Les règles d'accès
drop policy if exists "leon_docs: org members" on leon_docs;

create policy "leon_docs: direction" on leon_docs for all to authenticated
  using (est_direction(org_id)) with check (est_direction(org_id));

create policy "leon_docs: salarié lit" on leon_docs for select to authenticated
  using (est_salarie_de(org_id) and (
    path = 'net/pub'
    or path ~ '^restos/[^/]+/pub$'
    or path ~ '^restos/[^/]+/data/(planning|carte|equipe|ops)$'
    or path ~ '^restos/[^/]+/live/dispo$'
  ));

create policy "leon_docs: salarié écrit (insert)" on leon_docs for insert to authenticated
  with check (est_salarie_de(org_id) and path ~ '^restos/[^/]+/(data/(equipe|ops)|live/dispo)$');

create policy "leon_docs: salarié écrit (update)" on leon_docs for update to authenticated
  using (est_salarie_de(org_id) and path ~ '^restos/[^/]+/(data/(equipe|ops)|live/dispo)$')
  with check (est_salarie_de(org_id) and path ~ '^restos/[^/]+/(data/(equipe|ops)|live/dispo)$');
