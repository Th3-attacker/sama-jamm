-- Retrait d'un membre : le créateur doit encore faire partie du khatm pour retirer quelqu'un.
-- Avant cette migration, un créateur qui quittait son khatm (`quitter_khatm`) restait `createur` : il ne voyait plus le
-- khatm mais pouvait encore appeler `retirer_membre` sur un groupe qu'il avait quitté. À exécuter une fois, après
-- 011_exclusions_khatm.sql (SQL Editor > New query > Run). Additive : redéfinit seulement `retirer_membre`.
-- Retour arrière : rejouer `retirer_membre` de 011.
--
-- Limite connue (non traitée ici) : un créateur qui quitte son khatm n'est pas remplacé ; plus personne ne peut alors
-- retirer un membre. Passer le rôle à un autre membre demande une décision produit (qui devient créateur ?).

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
  -- Nouveau : le créateur doit toujours être membre du khatm.
  if not exists (select 1 from public.khatm_membres m where m.khatm_id = p_khatm and m.user_id = auth.uid()) then
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

revoke all on function public.retirer_membre(uuid, uuid) from public, anon;
grant execute on function public.retirer_membre(uuid, uuid) to authenticated;
