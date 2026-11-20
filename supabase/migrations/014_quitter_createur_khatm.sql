-- Un créateur qui quitte son khatm ne le laisse plus sans responsable (décision du propriétaire, 20 novembre 2026) :
--   * s'il y a d'autres membres, il transmet le rôle de créateur à l'un d'eux, ou ferme le khatm ;
--   * s'il est seul, quitter ferme et supprime le khatm.
-- Un khatm fermé (`etat = 'termine'`) ne peut plus être rejoint ni voir un juz pris.
-- À exécuter une fois, après 011_exclusions_khatm.sql et 013_retrait_membre_createur_membre.sql (SQL Editor > New query > Run).
-- NON APPLIQUÉE : à essayer sur une base de test avant la production.
-- Retour arrière : rejouer quitter_khatm de 002 (après `drop function public.quitter_khatm(uuid, uuid, boolean)`),
-- apercu_khatm et rejoindre_khatm de 011, prendre_juz de 002. La colonne `etat` peut rester : elle est identique à celle de 009.
--
-- Compatibilité : un téléphone qui appelle encore `quitter_khatm(p_khatm)` seul continue de marcher pour un simple
-- membre ; un créateur qui a d'autres membres reçoit une erreur (« transmettre le rôle ou fermer le khatm ») tant que
-- l'app n'est pas mise à jour.
-- Limite connue : l'app n'affiche pas encore « khatm fermé » aux membres restants (planche à dessiner) ; côté serveur,
-- prendre un juz y est déjà refusé (même réponse que « déjà pris »).

-- Même colonne que 009 : sans effet si 009 est déjà jouée.
alter table public.khatms add column if not exists etat text not null default 'ouvert' check (etat in ('ouvert', 'termine'));

drop function if exists public.quitter_khatm(uuid);

create or replace function public.quitter_khatm(p_khatm uuid, p_nouveau_createur uuid default null, p_fermer boolean default false)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_createur uuid;
  v_autres int;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  -- Verrou sur la ligne du khatm : deux départs ou un retrait en même temps ne se croisent pas.
  select k.createur into v_createur from public.khatms k where k.id = p_khatm for update;
  if not found then return; end if;
  -- Quitter un khatm dont on n'est pas membre ne fait rien (comme avant).
  if not exists (select 1 from public.khatm_membres m where m.khatm_id = p_khatm and m.user_id = auth.uid()) then
    return;
  end if;

  if v_createur = auth.uid() then
    select count(*)::int into v_autres from public.khatm_membres m
      where m.khatm_id = p_khatm and m.user_id <> auth.uid();

    if v_autres = 0 then
      -- Seul : le khatm est supprimé (membres, juz, exclusions et signalements partent en cascade).
      delete from public.khatms where id = p_khatm;
      return;
    end if;

    if p_nouveau_createur is not null then
      if p_nouveau_createur = auth.uid()
         or not exists (select 1 from public.khatm_membres m where m.khatm_id = p_khatm and m.user_id = p_nouveau_createur) then
        raise exception 'le nouveau créateur doit être un autre membre';
      end if;
      update public.khatms set createur = p_nouveau_createur where id = p_khatm;
    elsif p_fermer then
      update public.khatms set etat = 'termine' where id = p_khatm;
    else
      raise exception 'créateur : transmettre le rôle ou fermer le khatm';
    end if;
  end if;

  update public.khatm_parts set user_id = null, etat = 'libre', maj_le = now()
    where khatm_id = p_khatm and user_id = auth.uid() and etat = 'en_cours';
  delete from public.khatm_membres where khatm_id = p_khatm and user_id = auth.uid();
end;
$$;

revoke all on function public.quitter_khatm(uuid, uuid, boolean) from public, anon;
grant execute on function public.quitter_khatm(uuid, uuid, boolean) to authenticated;

-- Même comportement que 011 ; en plus, aucun aperçu pour un khatm fermé.
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
      and k.etat = 'ouvert'
      and not exists (select 1 from public.khatm_exclus e where e.khatm_id = k.id and e.user_id = auth.uid());
end;
$$;

-- Même comportement que 011 ; en plus, un khatm fermé ne peut plus être rejoint (null, comme un code inconnu).
create or replace function public.rejoindre_khatm(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_etat text;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  perform public.noter_tentative_code();

  select k.id, k.etat into v_id, v_etat from public.khatms k where k.code = upper(trim(p_code));
  -- Code inconnu ou khatm fermé : null, sans exception, pour que la tentative reste comptée (voir 010).
  if v_id is null or v_etat <> 'ouvert' then return null; end if;
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

-- Même comportement que 002 ; en plus, aucun juz ne se prend dans un khatm fermé.
create or replace function public.prendre_juz(p_khatm uuid, p_juz int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_membre(p_khatm) then raise exception 'non membre'; end if;
  update public.khatm_parts set user_id = auth.uid(), etat = 'en_cours', maj_le = now()
    where khatm_id = p_khatm and juz = p_juz and etat = 'libre'
      and exists (select 1 from public.khatms k where k.id = p_khatm and k.etat = 'ouvert');
  return found;
end;
$$;

revoke all on function public.apercu_khatm(text) from public, anon;
grant execute on function public.apercu_khatm(text) to authenticated;
revoke all on function public.rejoindre_khatm(text) from public, anon;
grant execute on function public.rejoindre_khatm(text) to authenticated;
revoke all on function public.prendre_juz(uuid, int) from public, anon;
grant execute on function public.prendre_juz(uuid, int) to authenticated;
