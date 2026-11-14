-- Limite aussi les essais de code de `rejoindre_khatm` : 30 tentatives par heure et par personne, au total.
-- Avant cette migration, seul `apercu_khatm` (007) était limité : on pouvait essayer des codes en boucle par
-- `rejoindre_khatm` et entrer dans des khatms inconnus. À exécuter une fois, après 009_conception_nov_2026.sql
-- (SQL Editor > New query > Run). Additive : ne supprime ni ne renomme rien.
-- Retour arrière : rejouer apercu_khatm de 007 et rejoindre_khatm de 002, puis drop function public.noter_tentative_code();
--
-- Compteur commun : la table public.apercus_khatm (créée par 007) sert désormais aux deux fonctions et compte
-- en fait des « tentatives de code ». Elle garde son nom pour ne rien casser de 007 ni des droits en place.
-- Le parcours normal (aperçu de l'invitation, puis adhésion) coûte 2 tentatives : 15 jonctions légitimes par
-- heure restent possibles, ce qui suffit largement.
--
-- Un code inconnu ne lève plus d'exception dans `rejoindre_khatm` : la fonction renvoie null. Une exception
-- annulerait la transaction, donc aussi la tentative notée, et les échecs ne compteraient jamais.
--
-- Hors périmètre (signalé, non traité ici) : 009 annonce que `rejoindre_khatm` devra lire `khatms.etat` et
-- `khatms.rejoindre_par_lien`. Cette version ne les lit pas encore ; elle fonctionne que 009 soit jouée ou non.

-- Note une tentative de code pour la personne connectée, ou refuse au-delà de 30 par heure.
-- Un verrou de transaction par personne sérialise ses appels : des appels parallèles ne peuvent pas lire tous
-- le même compte puis dépasser la limite ensemble. Le verrou est rendu à la fin de la transaction de l'appel.
create or replace function public.noter_tentative_code()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tentative_code_khatm:' || auth.uid()::text));

  delete from public.apercus_khatm where user_id = auth.uid() and quand < now() - interval '1 day';
  if (select count(*) from public.apercus_khatm
        where user_id = auth.uid() and quand > now() - interval '1 hour') >= 30 then
    raise exception 'trop de tentatives, réessayez plus tard' using errcode = 'P0001';
  end if;
  insert into public.apercus_khatm (user_id) values (auth.uid());
end;
$$;

-- Usage interne seulement : appelée par les deux fonctions ci-dessous (qui s'exécutent avec les droits du
-- propriétaire), jamais directement depuis l'app.
revoke all on function public.noter_tentative_code() from public, anon, authenticated;

-- Même comportement et mêmes colonnes que 007 ; seul le contrôle passe par le compteur commun et son verrou.
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
    where k.code = upper(trim(p_code));
end;
$$;

revoke all on function public.apercu_khatm(text) from public, anon;
grant execute on function public.apercu_khatm(text) to authenticated;

-- La tentative est comptée avant la recherche du code : un code faux compte autant qu'un bon.
-- Sous la limite, une adhésion valide continue de marcher ; rejoindre un khatm dont on est déjà membre
-- ne fait rien (on conflict do nothing) et renvoie son identifiant.
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
  -- Code inconnu : null, sans exception, pour que la tentative reste comptée (voir l'en-tête).
  if v_id is null then return null; end if;

  insert into public.khatm_membres (khatm_id, user_id, prenom)
    values (v_id, auth.uid(), public.prenom_courant())
    on conflict (khatm_id, user_id) do nothing;
  return v_id;
end;
$$;

revoke all on function public.rejoindre_khatm(text) from public, anon;
grant execute on function public.rejoindre_khatm(text) to authenticated;
