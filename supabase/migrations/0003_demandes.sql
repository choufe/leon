-- 11.06 · Demandes de démo venues de la vitrine.
-- N'importe quel visiteur peut ENVOYER une demande (insert), personne ne peut la lire
-- depuis le site public. Maurice les lit depuis son espace / le tableau Supabase.
create table if not exists public.demandes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prenom text not null check (char_length(prenom) between 1 and 80),
  resto text not null check (char_length(resto) between 1 and 120),
  ville text check (char_length(ville) <= 80),
  telephone text not null check (char_length(telephone) between 9 and 30),
  email text check (char_length(email) <= 160),
  nb_restos text check (nb_restos in ('1','2-3','4+')),
  creneau text check (creneau in ('matin','aprem','soir')),
  message text check (char_length(message) <= 2000),
  source text check (char_length(source) <= 200),
  statut text not null default 'nouvelle' check (statut in ('nouvelle','rappelee','demo','gagnee','perdue'))
);
alter table public.demandes enable row level security;
create policy "envoyer une demande" on public.demandes
  for insert to anon, authenticated
  with check (statut = 'nouvelle');
