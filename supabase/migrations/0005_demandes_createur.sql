-- 11.09 · Les demandes de démo arrivent dans l'espace créateur.
-- Lecture et suivi réservés au créateur (2e code validé). Le site public peut toujours seulement envoyer.
alter table public.demandes add column if not exists note text check (char_length(note) <= 2000);
alter table public.demandes add column if not exists maj_le timestamptz;

create or replace function createur_demandes()
returns setof public.demandes
language plpgsql security definer stable set search_path = public, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  return query select * from public.demandes order by created_at desc limit 500;
end $$;

create or replace function createur_demande_suivi(d_id uuid, nouveau_statut text, nouvelle_note text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not est_createur() then raise exception 'réservé au créateur'; end if;
  if nouveau_statut not in ('nouvelle','rappelee','demo','gagnee','perdue') then raise exception 'statut inconnu'; end if;
  update public.demandes set statut = nouveau_statut, note = left(nouvelle_note, 2000), maj_le = now() where id = d_id;
  return found;
end $$;

revoke all on function createur_demandes() from public, anon;
revoke all on function createur_demande_suivi(uuid, text, text) from public, anon;
grant execute on function createur_demandes() to authenticated;
grant execute on function createur_demande_suivi(uuid, text, text) to authenticated;
