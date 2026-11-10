-- Khatm : signalement d'un membre et retrait par le créateur (exigence Apple 1.2 sur les contenus d'utilisateurs).
-- À exécuter une fois, après 007_quota_apercu_khatm.sql : SQL Editor > New query > Run. Faire une sauvegarde avant.

create table if not exists public.khatm_signalements (
  id uuid primary key default gen_random_uuid(),
  khatm_id uuid not null references public.khatms (id) on delete cascade,
  signale_par uuid references auth.users (id) on delete set null,
  cible uuid not null references auth.users (id) on delete cascade,
  cree_le timestamptz not null default now(),
  check (signale_par is distinct from cible)
);

create index if not exists khatm_signalements_khatm on public.khatm_signalements (khatm_id);

-- Lecture et écriture uniquement par les fonctions ci-dessous : aucune règle RLS pour les clients.
alter table public.khatm_signalements enable row level security;

-- Signaler un autre membre du même khatm. Le signalement est enregistré pour examen ; il ne retire personne seul.
create or replace function public.signaler_membre(p_khatm uuid, p_cible uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if not public.est_membre(p_khatm) then raise exception 'non membre'; end if;
  if p_cible = auth.uid() then raise exception 'signalement de soi-même impossible'; end if;
  if not exists (select 1 from public.khatm_membres m where m.khatm_id = p_khatm and m.user_id = p_cible) then
    raise exception 'cible non membre';
  end if;
  insert into public.khatm_signalements (khatm_id, signale_par, cible) values (p_khatm, auth.uid(), p_cible);
end;
$$;

-- Retirer un membre : réservé au créateur du khatm. Les juz de ce membre redeviennent libres pour le groupe.
create or replace function public.retirer_membre(p_khatm uuid, p_cible uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if not exists (select 1 from public.khatms k where k.id = p_khatm and k.createur = auth.uid()) then
    raise exception 'réservé au créateur';
  end if;
  if p_cible = auth.uid() then raise exception 'le créateur ne peut pas se retirer ici'; end if;
  update public.khatm_parts set user_id = null, etat = 'libre', maj_le = now()
    where khatm_id = p_khatm and user_id = p_cible;
  delete from public.khatm_membres where khatm_id = p_khatm and user_id = p_cible;
end;
$$;

revoke all on function public.signaler_membre(uuid, uuid) from public, anon;
grant execute on function public.signaler_membre(uuid, uuid) to authenticated;
revoke all on function public.retirer_membre(uuid, uuid) from public, anon;
grant execute on function public.retirer_membre(uuid, uuid) to authenticated;
