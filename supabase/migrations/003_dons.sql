-- Déclarations de dons (facultatives), pour remercier. À exécuter une fois : SQL Editor > New query > Run.
-- Tout le monde peut déclarer (avec ou sans compte), personne ne peut relire : la vérification se fait
-- depuis le tableau de bord Supabase. Jamais de numéro de téléphone ni de code de wallet.

create table if not exists public.declarations_dons (
  id uuid primary key default gen_random_uuid(),
  wallet text not null check (wallet in ('bankily', 'masrvi', 'sedad')),
  montant integer not null check (montant between 1 and 10000000),
  reference text not null check (reference ~ '^[A-Z0-9]{4,40}$'),
  prenom text check (prenom is null or char_length(prenom) <= 40),
  message text check (message is null or char_length(message) <= 300),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'recu', 'introuvable')),
  cree_le timestamptz not null default now(),
  unique (wallet, reference)
);

alter table public.declarations_dons enable row level security;

drop policy if exists "déclarer un don" on public.declarations_dons;
create policy "déclarer un don" on public.declarations_dons
  for insert to anon, authenticated
  with check (statut = 'en_attente');

-- Aucune règle select, update ou delete : les déclarations ne se relisent pas depuis l'app.
