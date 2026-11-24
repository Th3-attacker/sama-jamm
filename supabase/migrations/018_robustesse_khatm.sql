-- Khatm : robustesse du serveur (revue du 24 novembre 2026).
-- NON APPLIQUÉE : écrite dans le dépôt, à essayer dans une transaction annulée puis à appliquer seulement avec l'accord
-- explicite du propriétaire. À exécuter une seule fois, après 017_khatm_echeance_future.sql. Additive : ne supprime ni
-- ne renomme rien, ne touche à aucune ligne existante.
-- Retour arrière : rejouer creer_khatm de 017, signaler_membre de 008 et marquer_juz_lu de 002, puis
--   drop function public.noter_creation_khatm();  drop table public.creations_khatm;
--   drop index if exists public.khatm_parts_user;
--
-- 1. Limite de création : 10 khatms par jour et par personne (valeur proposée, à valider). Sans elle, un compte
--    peut créer des khatms en boucle ; chacun écrit 31 lignes.
-- 2. Codes : le 7e caractère ne prenait que 16 valeurs sur 32, parce que l'octet 6 d'un UUID v4 porte la version.
--    Les 8 caractères viennent maintenant des octets 0 à 5, 9 et 10 (aucun n'a de bits imposés).
-- 3. Signalements : un même membre ne peut plus signaler deux fois la même cible dans le même khatm. Pas d'index
--    unique : la production contient déjà un doublon, que cette migration ne supprime pas.
-- 4. Index sur khatm_parts (user_id), utilisé par supprimer_mon_compte, quitter_khatm et retirer_membre.
-- 5. Un khatm dont les 30 juz sont lus passe à `termine` : plus de juz à prendre ni de membre à accepter (014).

-- 1. Compteur des créations -----------------------------------------------------------------------------------------

create table if not exists public.creations_khatm (
  user_id uuid not null references auth.users (id) on delete cascade,
  quand timestamptz not null default now()
);
create index if not exists creations_khatm_user on public.creations_khatm (user_id, quand);

-- Aucune règle RLS : lue et écrite uniquement par noter_creation_khatm (security definer).
alter table public.creations_khatm enable row level security;
revoke all on table public.creations_khatm from public, anon, authenticated;

-- Note une création pour la personne connectée, ou refuse au-delà de 10 par jour. Le verrou de transaction par personne
-- sérialise ses appels : des appels parallèles ne peuvent pas lire tous le même compte puis dépasser la limite.
-- La création est notée dans la même transaction que le khatm : un refus ou une erreur ne consomme rien.
create or replace function public.noter_creation_khatm()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('creation_khatm:' || auth.uid()::text));

  delete from public.creations_khatm where user_id = auth.uid() and quand < now() - interval '2 days';
  if (select count(*) from public.creations_khatm
        where user_id = auth.uid() and quand > now() - interval '1 day') >= 10 then
    raise exception 'trop de khatms créés, réessayez plus tard' using errcode = 'P0001';
  end if;
  insert into public.creations_khatm (user_id) values (auth.uid());
end;
$$;

-- Usage interne seulement : appelée par creer_khatm, jamais directement depuis l'app.
revoke all on function public.noter_creation_khatm() from public, anon, authenticated;

-- 2. creer_khatm : limite de création et codes mieux répartis --------------------------------------------------------
-- Le reste est celui de 017 (échéance jamais dans le passé, créateur membre, 30 parts libres).

create or replace function public.creer_khatm(p_nom text, p_intention text, p_echeance date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_code text;
  v_octets bytea;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  -- Octets 6 (version) et 8 (variante) d'un UUID v4 ne sont pas entièrement aléatoires : on les saute.
  v_positions int[] := array[0, 1, 2, 3, 4, 5, 9, 10];
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if p_echeance is not null and p_echeance < current_date - 1 then
    raise exception 'échéance passée';
  end if;
  perform public.noter_creation_khatm();
  loop
    -- 256 est multiple de 32 : chaque caractère est équiprobable.
    v_octets := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_octets, v_positions[i]) % 32), 1);
    end loop;
    exit when not exists (select 1 from public.khatms where code = v_code);
  end loop;
  insert into public.khatms (nom, intention, echeance, createur, code)
    values (trim(p_nom), nullif(trim(coalesce(p_intention, '')), ''), p_echeance, auth.uid(), v_code)
    returning id into v_id;
  insert into public.khatm_membres (khatm_id, user_id, prenom) values (v_id, auth.uid(), public.prenom_courant());
  insert into public.khatm_parts (khatm_id, juz) select v_id, g from generate_series(1, 30) g;
  return v_id;
end;
$$;

revoke all on function public.creer_khatm(text, text, date) from public, anon;
grant execute on function public.creer_khatm(text, text, date) to authenticated;

-- 3. signaler_membre : pas de doublon -------------------------------------------------------------------------------

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
  -- Verrou par (signalant, khatm, cible) : deux appels simultanés ne peuvent pas insérer deux fois.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('signalement:' || auth.uid()::text || ':' || p_khatm::text || ':' || p_cible::text));
  if not exists (
    select 1 from public.khatm_signalements s
    where s.khatm_id = p_khatm and s.signale_par = auth.uid() and s.cible = p_cible
  ) then
    insert into public.khatm_signalements (khatm_id, signale_par, cible) values (p_khatm, auth.uid(), p_cible);
  end if;
end;
$$;

revoke all on function public.signaler_membre(uuid, uuid) from public, anon;
grant execute on function public.signaler_membre(uuid, uuid) to authenticated;

-- 4. Index ----------------------------------------------------------------------------------------------------------

create index if not exists khatm_parts_user on public.khatm_parts (user_id);

-- 5. marquer_juz_lu : le khatm se termine quand les 30 juz sont lus ---------------------------------------------------
-- Le verrou par khatm évite que deux membres qui marquent les deux derniers juz en même temps ne voient chacun
-- « l'autre n'a pas fini » : le second attend la fin de la transaction du premier, puis relit l'état validé.

create or replace function public.marquer_juz_lu(p_khatm uuid, p_juz int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('fin_khatm:' || p_khatm::text));
  update public.khatm_parts set etat = 'lu', maj_le = now()
    where khatm_id = p_khatm and juz = p_juz and user_id = auth.uid() and etat = 'en_cours';
  if not found then return false; end if;
  if not exists (select 1 from public.khatm_parts where khatm_id = p_khatm and etat <> 'lu') then
    update public.khatms set etat = 'termine' where id = p_khatm and etat = 'ouvert';
  end if;
  return true;
end;
$$;

revoke all on function public.marquer_juz_lu(uuid, int) from public, anon;
grant execute on function public.marquer_juz_lu(uuid, int) to authenticated;
