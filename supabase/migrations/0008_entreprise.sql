-- 12.02 · « Mon entreprise » : le suivi de Maurice (formules, paiements, dépenses, demandes).
-- Tout passe par des fonctions réservées au créateur (2e code validé). Aucune lecture directe.

-- La formule de chaque resto client.
alter table orgs
  add column if not exists formule text check (formule in ('fondateur','normal','offert')),
  add column if not exists paiement text not null default 'mensuel' check (paiement in ('mensuel','annuel')),
  add column if not exists abo_debut date,
  add column if not exists mois_offerts int not null default 0 check (mois_offerts between 0 and 120),
  add column if not exists tarif numeric(10,2) check (tarif >= 0);

-- Le cahier de compte : ce qui rentre (abonnements, kits) et ce qui sort (matériel, logiciels…).
create table if not exists leon_compta (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sens text not null check (sens in ('entree','sortie')),
  date date not null default current_date,
  montant numeric(10,2) not null check (montant > 0),
  libelle text not null check (char_length(libelle) between 1 and 160),
  categorie text check (char_length(categorie) <= 60),
  org_id uuid references orgs(id) on delete set null,
  moyen text check (char_length(moyen) <= 40)
);
alter table leon_compta enable row level security;

-- Tout ce qu'il faut pour l'écran, en une fois.
create or replace function createur_entreprise() returns jsonb
language plpgsql security definer stable set search_path = public, extensions, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  return jsonb_build_object(
    'restos', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'nom', o.name, 'ville', o.ville, 'patron', o.patron_prenom, 'statut', o.statut,
        'test', o.test, 'supprime_le', o.supprime_le, 'created_at', o.created_at, 'a_moi', o.owner_user_id = auth.uid(),
        'formule', o.formule, 'paiement', o.paiement, 'abo_debut', o.abo_debut, 'mois_offerts', o.mois_offerts, 'tarif', o.tarif
      ) order by o.created_at), '[]'::jsonb) from orgs o),
    'compta', (select coalesce(jsonb_agg(to_jsonb(c) order by c.date desc, c.created_at desc), '[]'::jsonb) from leon_compta c),
    'demandes', (select coalesce(jsonb_object_agg(statut, n), '{}'::jsonb) from (select statut, count(*) n from demandes group by statut) d)
  );
end $$;

create or replace function createur_abonnement(o_id uuid, f text, p text, debut date, offerts int, t numeric)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  update orgs set formule = f, paiement = coalesce(p, 'mensuel'), abo_debut = debut,
    mois_offerts = greatest(0, coalesce(offerts, 0)), tarif = t
    where id = o_id;
  return found;
end $$;

create or replace function createur_compta_ajouter(s text, d date, m numeric, l text, cat text, o_id uuid, moy text)
returns uuid language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare i uuid;
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  insert into leon_compta (sens, date, montant, libelle, categorie, org_id, moyen)
    values (s, coalesce(d, current_date), m, left(trim(l), 160), nullif(left(trim(coalesce(cat, '')), 60), ''), o_id, nullif(left(trim(coalesce(moy, '')), 40), ''))
    returning id into i;
  return i;
end $$;

create or replace function createur_compta_supprimer(c_id uuid) returns boolean
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  delete from leon_compta where id = c_id;
  return found;
end $$;

do $$
declare f text;
begin
  foreach f in array array['createur_entreprise()','createur_abonnement(uuid, text, text, date, integer, numeric)',
    'createur_compta_ajouter(text, date, numeric, text, text, uuid, text)','createur_compta_supprimer(uuid)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
