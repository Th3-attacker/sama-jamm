-- Conception du système (12 novembre 2026) : synchronisation des favoris et des réglages, configuration publique
-- de l'app, noms de fonctions de la conception. NON APPLIQUÉE : à relire puis à exécuter sur une branche Supabase
-- avant la production (SQL Editor > New query > Run), après 008_signalement_khatm.sql. Additive : ne supprime rien.
-- Aucune table ne contient de position, de montant ni de ligne de budget.

-- 1. Profils : langue de l'interface (facultatif).
alter table public.profils add column if not exists langue text check (langue is null or langue in ('fr', 'ar'));

-- 2. Khatm : état et coupe-circuit du lien d'invitation. `rejoindre_khatm` devra les lire (voir ECARTS.md).
alter table public.khatms add column if not exists etat text not null default 'ouvert' check (etat in ('ouvert', 'termine'));
alter table public.khatms add column if not exists rejoindre_par_lien boolean not null default true;

-- 3. Favoris copiés d'un téléphone à l'autre. Union des téléphones ; une suppression est une ligne `supprime`.
create table if not exists public.favoris_sync (
  profil_id uuid not null references auth.users (id) on delete cascade,
  cle text not null check (char_length(cle) between 1 and 80),
  ajoute_le timestamptz not null default now(),
  supprime boolean not null default false,
  primary key (profil_id, cle)
);
alter table public.favoris_sync enable row level security;

drop policy if exists "favoris lus par leur titulaire" on public.favoris_sync;
create policy "favoris lus par leur titulaire" on public.favoris_sync
  for select to authenticated using ((select auth.uid()) = profil_id);
drop policy if exists "favoris ajoutés par leur titulaire" on public.favoris_sync;
create policy "favoris ajoutés par leur titulaire" on public.favoris_sync
  for insert to authenticated with check ((select auth.uid()) = profil_id);
drop policy if exists "favoris modifiés par leur titulaire" on public.favoris_sync;
create policy "favoris modifiés par leur titulaire" on public.favoris_sync
  for update to authenticated using ((select auth.uid()) = profil_id) with check ((select auth.uid()) = profil_id);
drop policy if exists "favoris supprimés par leur titulaire" on public.favoris_sync;
create policy "favoris supprimés par leur titulaire" on public.favoris_sync
  for delete to authenticated using ((select auth.uid()) = profil_id);

-- 4. Réglages copiés : le plus récent l'emporte (`maj_le`). Taille bornée.
create table if not exists public.reglages_sync (
  profil_id uuid primary key references auth.users (id) on delete cascade,
  donnees jsonb not null check (pg_column_size(donnees) <= 16384),
  maj_le timestamptz not null default now()
);
alter table public.reglages_sync enable row level security;

drop policy if exists "réglages lus par leur titulaire" on public.reglages_sync;
create policy "réglages lus par leur titulaire" on public.reglages_sync
  for select to authenticated using ((select auth.uid()) = profil_id);
drop policy if exists "réglages ajoutés par leur titulaire" on public.reglages_sync;
create policy "réglages ajoutés par leur titulaire" on public.reglages_sync
  for insert to authenticated with check ((select auth.uid()) = profil_id);
drop policy if exists "réglages modifiés par leur titulaire" on public.reglages_sync;
create policy "réglages modifiés par leur titulaire" on public.reglages_sync
  for update to authenticated using ((select auth.uid()) = profil_id) with check ((select auth.uid()) = profil_id);
drop policy if exists "réglages supprimés par leur titulaire" on public.reglages_sync;
create policy "réglages supprimés par leur titulaire" on public.reglages_sync
  for delete to authenticated using ((select auth.uid()) = profil_id);

-- 5. Configuration publique : une seule ligne, lisible par tous, écrite par l'équipe seulement
--    (aucune règle d'écriture : tableau de bord ou clé de service, jamais depuis l'app).
create table if not exists public.config_app (
  id smallint primary key default 1 check (id = 1),
  version_min_ios text not null default '1.0.0',
  version_min_android text not null default '1.0.0',
  version_contenu integer not null default 1,
  contenu_url text,
  contenu_sha256 text check (contenu_sha256 is null or contenu_sha256 ~ '^[0-9a-f]{64}$'),
  maj_le timestamptz not null default now()
);
alter table public.config_app enable row level security;
insert into public.config_app (id) values (1) on conflict (id) do nothing;

drop policy if exists "configuration lisible par tous" on public.config_app;
create policy "configuration lisible par tous" on public.config_app
  for select to anon, authenticated using (true);

-- 6. Noms de la conception : `terminer_juz` et `supprimer_compte`. Les fonctions déjà utilisées par l'app
--    (`marquer_juz_lu`, `supprimer_mon_compte`) restent en place ; celles-ci les appellent.
create or replace function public.terminer_juz(p_khatm uuid, p_juz int)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select public.marquer_juz_lu(p_khatm, p_juz);
$$;

create or replace function public.supprimer_compte()
returns void
language sql
security invoker
set search_path = ''
as $$
  select public.supprimer_mon_compte();
$$;

revoke all on function public.terminer_juz(uuid, int) from public, anon;
grant execute on function public.terminer_juz(uuid, int) to authenticated;
revoke all on function public.supprimer_compte() from public, anon;
grant execute on function public.supprimer_compte() to authenticated;
