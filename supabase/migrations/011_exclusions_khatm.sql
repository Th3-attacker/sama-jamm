-- Retrait d'un membre durable : une personne retirée par le créateur ne peut plus rejoindre le même khatm avec son code.
-- Avant cette migration, `retirer_membre` supprimait seulement la ligne de membre et `rejoindre_khatm` acceptait le même
-- code aussitôt. À exécuter une fois, après 010_quota_rejoindre_khatm.sql (SQL Editor > New query > Run).
-- Additive : crée une table et redéfinit trois fonctions, ne supprime ni ne renomme rien.
-- Retour arrière : rejouer retirer_membre de 008 ainsi que apercu_khatm et rejoindre_khatm de 010, puis drop table public.khatm_exclus;
--
-- Celui qui quitte lui-même (`quitter_khatm`) n'est pas exclu : il peut revenir avec le code.
-- Une personne exclue qui essaie de rejoindre reçoit null, comme pour un code inconnu : la tentative reste comptée
-- (voir 010) et l'exclusion n'est pas révélée. Son aperçu d'invitation reste vide aussi (zéro ligne, comme un code inconnu).
-- Limite connue : une personne exclue qui supprime son compte et en recrée un autre peut revenir.
-- Il n'y a pas encore d'écran pour réadmettre une personne exclue.
-- À reprendre : 009 annonce que `rejoindre_khatm` lira `khatms.etat` et `khatms.rejoindre_par_lien`. Cette migration
-- 009 devra partir de la version de `rejoindre_khatm` écrite ici, sans perdre le contrôle d'exclusion.

create table if not exists public.khatm_exclus (
  khatm_id uuid not null references public.khatms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  quand timestamptz not null default now(),
  primary key (khatm_id, user_id)
);

-- Aucune règle d'accès : la table n'est lue et écrite que par les fonctions ci-dessous (droits du propriétaire).
alter table public.khatm_exclus enable row level security;
revoke all on table public.khatm_exclus from public, anon, authenticated;

-- Même comportement que 008 ; en plus, la personne retirée est inscrite dans la liste des exclus.
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
  -- Seulement si la cible était membre : on ne pré-exclut pas un identifiant quelconque.
  if found then
    insert into public.khatm_exclus (khatm_id, user_id) values (p_khatm, p_cible)
      on conflict (khatm_id, user_id) do nothing;
  end if;
end;
$$;

-- Même comportement et mêmes colonnes que 010 (compteur commun des tentatives) ; en plus, aucun aperçu pour une personne exclue.
create or replace function public.apercu_khatm(p_code text)
returns table (id uuid, nom text, intention text, echeance date, invite_par text, libres int)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  perform public.noter_tentative_code();

  return query
    select k.id, k.nom, k.intention, k.echeance, p.prenom,
           (select count(*)::int from public.khatm_parts x where x.khatm_id = k.id and x.etat = 'libre')
    from public.khatms k
    left join public.profils p on p.id = k.createur
    where k.code = upper(trim(p_code))
      and not exists (select 1 from public.khatm_exclus e where e.khatm_id = k.id and e.user_id = auth.uid());
end;
$$;

-- Même comportement que 010 (compteur commun des tentatives) ; en plus, une personne exclue ne peut pas rejoindre.
create or replace function public.rejoindre_khatm(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  perform public.noter_tentative_code();

  select id into v_id from public.khatms where code = upper(trim(p_code));
  -- Code inconnu : null, sans exception, pour que la tentative reste comptée (voir 010).
  if v_id is null then return null; end if;
  -- Personne exclue par le créateur : null aussi, sans rien révéler.
  if exists (select 1 from public.khatm_exclus x where x.khatm_id = v_id and x.user_id = auth.uid()) then
    return null;
  end if;

  insert into public.khatm_membres (khatm_id, user_id, prenom)
    values (v_id, auth.uid(), public.prenom_courant())
    on conflict (khatm_id, user_id) do nothing;
  return v_id;
end;
$$;

revoke all on function public.retirer_membre(uuid, uuid) from public, anon;
grant execute on function public.retirer_membre(uuid, uuid) to authenticated;
revoke all on function public.apercu_khatm(text) from public, anon;
grant execute on function public.apercu_khatm(text) to authenticated;
revoke all on function public.rejoindre_khatm(text) from public, anon;
grant execute on function public.rejoindre_khatm(text) to authenticated;
