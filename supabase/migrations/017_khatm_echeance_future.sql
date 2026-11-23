-- Khatm : l'échéance ne peut pas être dans le passé (décision du propriétaire, 23 nov 2026).
-- APPLIQUÉE en production le 23 novembre 2026 avec l'accord explicite du propriétaire (« Applique la migration 017 »),
-- après un essai dans une transaction annulée. À exécuter une seule fois, après 016_noms_dedies_publication_directe.sql.
--
-- L'écran refuse déjà une date passée ; ce contrôle protège la base d'un client modifié. Un jour de tolérance : la base
-- compte en UTC, un téléphone en retard sur l'UTC peut encore être « hier » pour elle. Les khatms existants ne bougent pas.
-- Le reste de la fonction est celui de 006_codes_khatm.sql (code aléatoire, créateur membre, 30 parts libres).

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
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  -- Une date de fin passée est refusée. Un jour de tolérance : `current_date` est en UTC, le téléphone peut être derrière.
  if p_echeance is not null and p_echeance < current_date - 1 then
    raise exception 'échéance passée';
  end if;
  loop
    -- 16 octets aléatoires par code ; 256 est multiple de 32, donc chaque caractère est équiprobable.
    v_octets := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    for i in 0..7 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_octets, i) % 32), 1);
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
