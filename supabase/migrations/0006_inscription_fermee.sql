-- 11.10 · Une fois le créateur en place, /inscription se ferme : les autres comptes viennent uniquement par invitation.
create or replace function createur_existe() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists (select 1 from leon_createurs where pin_hash is not null);
$$;
revoke all on function createur_existe() from public;
grant execute on function createur_existe() to anon, authenticated;
