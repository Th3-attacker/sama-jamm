-- Noms dédiés : publication directe (décision du propriétaire, 23 nov 2026, variante 1).
-- APPLIQUÉE en production le 23 novembre 2026 avec l'accord explicite du propriétaire (« Appliquer 016 »), après un essai dans
-- une transaction annulée. À exécuter une seule fois, après 015_noms_dedies.sql.
--
-- Avant : un nom proposé restait 'en_attente' jusqu'à une relecture à la main. Désormais, un nom proposé par un compte
-- connecté est enregistré tout de suite à l'état 'valide' : il apparaît sur le site sans délai. Le contrôle passe après coup :
-- le bouton « Signaler » du site (`signaler_nom`, 015) fait monter un compteur ; rien n'est masqué tout seul, le propriétaire
-- retire à la main (variante 1 ; le masquage automatique à 3 signalements a été écarté).
--
-- Inchangé : réservé aux comptes (session anonyme refusée), mêmes contrôles du nom, mêmes limites (5 par jour, 20 par
-- personne), doublon = renvoie le nom déjà publié, auteur enregistré mais jamais exposé, lecture publique par `noms_dedies_publics`.
-- Les noms déjà en attente (il y en a un au 23 nov, arrivé après 015) ne sont PAS publiés par cette migration : le propriétaire
-- décide à la main (`update public.noms_dedies set etat = 'valide', valide_le = now() where id = '<id>';` ou `etat = 'refuse'`).
-- Additive côté données : ne supprime ni ne renomme rien.
--
-- Retour arrière : rejouer `dedier_nom` de 015 (insertion à l'état 'en_attente').
--
-- À surveiller à la main (SQL Editor) :
--   select id, nom, formule, valide_le, signalements from public.noms_dedies where signalements > 0 order by signalements desc;
--   update public.noms_dedies set etat = 'refuse' where id = '<id>';                -- retirer un nom publié
--   select id, nom, formule, valide_le from public.noms_dedies where etat = 'valide' order by valide_le desc limit 20;   -- derniers noms publiés

create or replace function public.dedier_nom(p_nom text, p_formule text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nom text;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  -- Réservé aux comptes : une session anonyme (claim `is_anonymous` du jeton) est refusée.
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'connexion requise'; end if;

  -- Un verrou par personne : des appels parallèles ne peuvent pas dépasser la limite ensemble.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nom_dedie:' || auth.uid()::text));

  if p_formule is null or p_formule not in ('masculin', 'feminin') then raise exception 'formule invalide'; end if;

  -- Espaces normalisés ; 2 à 80 caractères ; pas de lien, de chiffre ni de symbole d'adresse ou de code.
  v_nom := pg_catalog.btrim(pg_catalog.regexp_replace(coalesce(p_nom, ''), '\s+', ' ', 'g'));
  if pg_catalog.char_length(v_nom) < 2 or pg_catalog.char_length(v_nom) > 80 then raise exception 'nom invalide'; end if;
  if v_nom ~ '[0-9@/\\<>:;{}\[\]|=_&%$#*+~`"!?()]' or pg_catalog.lower(v_nom) ~ '(http|www\.)' then
    raise exception 'nom invalide';
  end if;

  delete from public.noms_dedies_essais where user_id = auth.uid() and quand < now() - interval '1 day';
  if (select count(*) from public.noms_dedies_essais where user_id = auth.uid() and quand > now() - interval '1 day') >= 5 then
    raise exception 'trop de noms, réessayez plus tard' using errcode = 'P0001';
  end if;
  if (select count(*) from public.noms_dedies where auteur = auth.uid()) >= 20 then
    raise exception 'trop de noms, réessayez plus tard' using errcode = 'P0001';
  end if;
  insert into public.noms_dedies_essais (user_id) values (auth.uid());

  select id into v_id from public.noms_dedies
    where pg_catalog.lower(nom) = pg_catalog.lower(v_nom) and formule = p_formule and etat <> 'refuse';
  if v_id is not null then return v_id; end if;

  -- Publication directe : l'état et la date ne viennent jamais du client.
  insert into public.noms_dedies (nom, formule, auteur, etat, valide_le)
    values (v_nom, p_formule, auth.uid(), 'valide', now()) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.dedier_nom(text, text) from public, anon;
grant execute on function public.dedier_nom(text, text) to authenticated;
