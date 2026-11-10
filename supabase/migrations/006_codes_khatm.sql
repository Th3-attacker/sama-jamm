-- Codes d'invitation des khatms : générés à partir d'une source aléatoire cryptographique (gen_random_uuid),
-- au lieu de random() de PostgreSQL, qui n'est pas prévu pour la sécurité.
-- À exécuter une fois, après 002_khatm.sql : SQL Editor > New query > Run.

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
