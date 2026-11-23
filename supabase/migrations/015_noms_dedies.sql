-- Noms dédiés : un nom de proche décédé, proposé depuis l'app, relu à la main, puis publié sur le site (page 16 du canevas).
-- NON APPLIQUÉE. À exécuter une seule fois, après 014_quitter_createur_khatm.sql (SQL Editor > New query > Run), et
-- seulement avec l'accord explicite du propriétaire, après un essai dans une transaction annulée. Faire une sauvegarde avant.
-- Additive : ne supprime ni ne renomme rien.
--
-- Décisions du propriétaire (23 nov 2026) : n'importe qui peut dédier un nom, sans compte (connexion anonyme de Supabase :
-- à activer dans Authentication > Providers > Anonymous, réglage de production à part) ; nom complet en texte libre ;
-- relecture à la main dans le SQL Editor (aucune interface) ; l'auteur est enregistré, jamais exposé, et son lien
-- est effacé avec son compte ; signalement d'un nom depuis le site.
--
-- Sécurité : RLS activée sans aucune règle pour les clients. Écriture seulement par `dedier_nom` (connecté, anonyme compris).
-- Lecture publique seulement par `noms_dedies_publics` : noms validés, sans auteur, date arrondie au jour.
-- Un nom n'apparaît qu'après avoir été passé à 'valide' à la main : le client ne peut jamais choisir l'état.
--
-- Retour arrière : drop function public.dedier_nom(text, text), public.noms_dedies_publics(text, timestamptz, int),
--   public.signaler_nom(uuid); drop table public.noms_dedies_essais, public.noms_dedies;  (les noms saisis sont perdus).
--
-- Relire à la main (SQL Editor) :
--   select id, nom, formule, cree_le, signalements from public.noms_dedies where etat = 'en_attente' order by cree_le;
--   update public.noms_dedies set etat = 'valide', valide_le = now() where id = '<id>';
--   update public.noms_dedies set etat = 'refuse' where id = '<id>';                -- refuser ou retirer un nom publié
--   select id, nom, signalements from public.noms_dedies where signalements > 0 order by signalements desc;

create table if not exists public.noms_dedies (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(nom) between 2 and 80),
  formule text not null check (formule in ('masculin', 'feminin')),
  etat text not null default 'en_attente' check (etat in ('en_attente', 'valide', 'refuse')),
  -- Jamais exposé. `on delete set null` : la suppression du compte efface le lien, le nom publié reste.
  auteur uuid references auth.users (id) on delete set null,
  signalements int not null default 0,
  cree_le timestamptz not null default now(),
  valide_le timestamptz
);

-- Pas de doublon vivant : même nom (sans tenir compte de la casse) et même formule, hors noms refusés.
create unique index if not exists noms_dedies_unique on public.noms_dedies (lower(nom), formule) where etat <> 'refuse';
create index if not exists noms_dedies_publics_idx on public.noms_dedies (valide_le desc) where etat = 'valide';
create index if not exists noms_dedies_auteur on public.noms_dedies (auteur);

alter table public.noms_dedies enable row level security;
revoke all on table public.noms_dedies from public, anon, authenticated;

-- Essais d'envoi par personne : limite de débit, comme `apercus_khatm` (007, 010).
create table if not exists public.noms_dedies_essais (
  user_id uuid not null references auth.users (id) on delete cascade,
  quand timestamptz not null default now()
);
create index if not exists noms_dedies_essais_user on public.noms_dedies_essais (user_id, quand);
alter table public.noms_dedies_essais enable row level security;
revoke all on table public.noms_dedies_essais from public, anon, authenticated;

-- Proposer un nom. Renvoie l'identifiant du nom, ou celui du nom déjà proposé (le doublon n'est pas signalé :
-- la personne voit « Merci » dans les deux cas). Contrôles côté serveur ; rien de ce qu'envoie le client
-- (état, auteur, date) n'est cru.
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

  insert into public.noms_dedies (nom, formule, auteur) values (v_nom, p_formule, auth.uid()) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.dedier_nom(text, text) from public, anon;
grant execute on function public.dedier_nom(text, text) to authenticated;

-- Lecture publique pour le site : noms validés seulement, du plus récent au plus ancien, sans auteur ni heure.
-- `p_avant` : curseur de pagination (valide_le du dernier nom reçu). `p_limite` : 1 à 24, 12 par défaut.
-- `p_recherche` : texte cherché dans le nom, % et _ pris comme des caractères ordinaires.
create or replace function public.noms_dedies_publics(p_recherche text default null, p_avant timestamptz default null, p_limite int default 12)
returns table (id uuid, nom text, formule text, valide_le timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.nom, n.formule, n.valide_le
  from public.noms_dedies n
  where n.etat = 'valide'
    and (p_avant is null or n.valide_le < p_avant)
    and (
      nullif(pg_catalog.btrim(coalesce(p_recherche, '')), '') is null
      or pg_catalog.lower(n.nom) like '%' || pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(
           pg_catalog.lower(pg_catalog.btrim(p_recherche)), '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
    )
  order by n.valide_le desc
  limit greatest(1, least(coalesce(p_limite, 12), 24));
$$;

revoke all on function public.noms_dedies_publics(text, timestamptz, int) from public;
grant execute on function public.noms_dedies_publics(text, timestamptz, int) to anon, authenticated;

-- Signaler un nom publié (exigence Apple 1.2 sur les contenus d'utilisateurs) : le compteur monte, rien n'est retiré
-- tout seul ; le propriétaire relit et retire à la main. Ouvert à tout visiteur du site, sans compte.
create or replace function public.signaler_nom(p_nom uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.noms_dedies set signalements = signalements + 1 where id = p_nom and etat = 'valide';
end;
$$;

revoke all on function public.signaler_nom(uuid) from public;
grant execute on function public.signaler_nom(uuid) to anon, authenticated;
