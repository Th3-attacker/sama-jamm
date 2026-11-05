-- Khatm collectif (lot G2). À exécuter une fois, après 001_comptes.sql : SQL Editor > New query > Run.
-- Seuls les membres d'un khatm le voient ; toute écriture passe par les fonctions ci-dessous (security definer),
-- qui vérifient la personne connectée et évitent que deux membres prennent le même juz.

create table if not exists public.khatms (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(nom) between 1 and 60),
  intention text check (intention is null or char_length(intention) <= 120),
  echeance date,
  createur uuid not null references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z2-9]{8}$'),
  cree_le timestamptz not null default now()
);

create table if not exists public.khatm_membres (
  khatm_id uuid not null references public.khatms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  prenom text check (prenom is null or char_length(prenom) <= 40),
  rejoint_le timestamptz not null default now(),
  primary key (khatm_id, user_id)
);

create table if not exists public.khatm_parts (
  khatm_id uuid not null references public.khatms (id) on delete cascade,
  juz smallint not null check (juz between 1 and 30),
  user_id uuid references auth.users (id) on delete set null,
  etat text not null default 'libre' check (etat in ('libre', 'en_cours', 'lu')),
  maj_le timestamptz not null default now(),
  primary key (khatm_id, juz)
);

create index if not exists khatm_membres_user on public.khatm_membres (user_id);

-- Membre du khatm ? (security definer : évite la récursion des règles RLS entre tables.)
create or replace function public.est_membre(k uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.khatm_membres m where m.khatm_id = k and m.user_id = auth.uid());
$$;

alter table public.khatms enable row level security;
alter table public.khatm_membres enable row level security;
alter table public.khatm_parts enable row level security;

drop policy if exists "khatm visible par ses membres" on public.khatms;
create policy "khatm visible par ses membres" on public.khatms
  for select to authenticated using (public.est_membre(id));

drop policy if exists "membres visibles par les membres" on public.khatm_membres;
create policy "membres visibles par les membres" on public.khatm_membres
  for select to authenticated using (public.est_membre(khatm_id));

drop policy if exists "parts visibles par les membres" on public.khatm_parts;
create policy "parts visibles par les membres" on public.khatm_parts
  for select to authenticated using (public.est_membre(khatm_id));

-- Aucune règle insert, update ou delete : les tables ne s'écrivent que par les fonctions.

create or replace function public.prenom_courant()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.prenom from public.profils p where p.id = auth.uid();
$$;

create or replace function public.creer_khatm(p_nom text, p_intention text, p_echeance date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
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

-- Aperçu d'une invitation, avant de rejoindre (le khatm n'est pas encore visible par RLS).
create or replace function public.apercu_khatm(p_code text)
returns table (id uuid, nom text, intention text, echeance date, invite_par text, libres int)
language sql
stable
security definer
set search_path = ''
as $$
  select k.id, k.nom, k.intention, k.echeance, p.prenom,
         (select count(*)::int from public.khatm_parts x where x.khatm_id = k.id and x.etat = 'libre')
  from public.khatms k
  left join public.profils p on p.id = k.createur
  where k.code = upper(trim(p_code)) and auth.uid() is not null;
$$;

create or replace function public.rejoindre_khatm(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select id into v_id from public.khatms where code = upper(trim(p_code));
  if v_id is null then raise exception 'khatm inconnu'; end if;
  insert into public.khatm_membres (khatm_id, user_id, prenom)
    values (v_id, auth.uid(), public.prenom_courant())
    on conflict (khatm_id, user_id) do nothing;
  return v_id;
end;
$$;

-- Prendre un juz libre : une seule personne gagne, même si deux le touchent en même temps.
create or replace function public.prendre_juz(p_khatm uuid, p_juz int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_membre(p_khatm) then raise exception 'non membre'; end if;
  update public.khatm_parts set user_id = auth.uid(), etat = 'en_cours', maj_le = now()
    where khatm_id = p_khatm and juz = p_juz and etat = 'libre';
  return found;
end;
$$;

create or replace function public.rendre_juz(p_khatm uuid, p_juz int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.khatm_parts set user_id = null, etat = 'libre', maj_le = now()
    where khatm_id = p_khatm and juz = p_juz and user_id = auth.uid() and etat = 'en_cours';
  return found;
end;
$$;

create or replace function public.marquer_juz_lu(p_khatm uuid, p_juz int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.khatm_parts set etat = 'lu', maj_le = now()
    where khatm_id = p_khatm and juz = p_juz and user_id = auth.uid() and etat = 'en_cours';
  return found;
end;
$$;

create or replace function public.quitter_khatm(p_khatm uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.khatm_parts set user_id = null, etat = 'libre', maj_le = now()
    where khatm_id = p_khatm and user_id = auth.uid() and etat = 'en_cours';
  delete from public.khatm_membres where khatm_id = p_khatm and user_id = auth.uid();
end;
$$;

-- Suppression du compte (remplace la version de 001) : les juz en cours redeviennent libres pour le groupe.
create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  update public.khatm_parts set user_id = null, etat = 'libre', maj_le = now()
    where user_id = auth.uid() and etat = 'en_cours';
  delete from auth.users where id = auth.uid();
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'est_membre(uuid)', 'prenom_courant()', 'creer_khatm(text, text, date)', 'apercu_khatm(text)',
    'rejoindre_khatm(text)', 'prendre_juz(uuid, int)', 'rendre_juz(uuid, int)', 'marquer_juz_lu(uuid, int)',
    'quitter_khatm(uuid)', 'supprimer_mon_compte()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- Temps réel : la grille des juz se met à jour chez tous les membres (les règles RLS s'appliquent aussi ici).
do $$
begin
  alter publication supabase_realtime add table public.khatm_parts;
exception when duplicate_object then null;
end;
$$;
