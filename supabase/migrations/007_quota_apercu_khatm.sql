-- Limite les tentatives de lecture d'un code d'invitation : 30 aperçus par heure et par personne.
-- Empêche de parcourir les codes en boucle. À exécuter une fois, après 006_codes_khatm.sql.

create table if not exists public.apercus_khatm (
  user_id uuid not null references auth.users (id) on delete cascade,
  quand timestamptz not null default now()
);

create index if not exists apercus_khatm_user_quand on public.apercus_khatm (user_id, quand);

-- Aucune règle RLS : la table n'est lue ni écrite que par la fonction ci-dessous.
alter table public.apercus_khatm enable row level security;

create or replace function public.apercu_khatm(p_code text)
returns table (id uuid, nom text, intention text, echeance date, invite_par text, libres int)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  delete from public.apercus_khatm where user_id = auth.uid() and quand < now() - interval '1 day';
  if (select count(*) from public.apercus_khatm
        where user_id = auth.uid() and quand > now() - interval '1 hour') >= 30 then
    raise exception 'trop de tentatives, réessayez plus tard' using errcode = 'P0001';
  end if;
  insert into public.apercus_khatm (user_id) values (auth.uid());

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
