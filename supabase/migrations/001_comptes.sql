-- Comptes Sama Jàmm (lot G1). À exécuter une fois dans Supabase : SQL Editor > New query > Run.
-- Données minimales : un prénom facultatif. Le budget, la position et la lecture ne sont jamais envoyés.

create table if not exists public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text check (prenom is null or char_length(prenom) between 1 and 40),
  cree_le timestamptz not null default now()
);

alter table public.profils enable row level security;

-- Chacun ne voit et ne modifie que son propre profil.
drop policy if exists "profil lisible par son titulaire" on public.profils;
create policy "profil lisible par son titulaire" on public.profils
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profil créé par son titulaire" on public.profils;
create policy "profil créé par son titulaire" on public.profils
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profil modifié par son titulaire" on public.profils;
create policy "profil modifié par son titulaire" on public.profils
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Suppression du compte par la personne connectée elle-même (exigée par les stores).
-- security definer : seule cette fonction peut effacer l'utilisateur, et seulement le sien.
create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'non connecté';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
