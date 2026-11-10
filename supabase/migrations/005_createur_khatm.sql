-- Khatm : la suppression du compte du créateur ne doit plus effacer le khatm des autres membres.
-- À exécuter une fois, après 002_khatm.sql : SQL Editor > New query > Run. Faire une sauvegarde avant.

alter table public.khatms alter column createur drop not null;
alter table public.khatms drop constraint if exists khatms_createur_fkey;
alter table public.khatms add constraint khatms_createur_fkey
  foreign key (createur) references auth.users (id) on delete set null;

-- Remplace la version de 002 : le rôle de créateur passe au membre le plus ancien ; un khatm sans autre membre est supprimé.
create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  k record;
  v_nouveau uuid;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;

  update public.khatm_parts set user_id = null, etat = 'libre', maj_le = now()
    where user_id = auth.uid() and etat = 'en_cours';

  for k in select id from public.khatms where createur = auth.uid() loop
    select m.user_id into v_nouveau
      from public.khatm_membres m
      where m.khatm_id = k.id and m.user_id <> auth.uid()
      order by m.rejoint_le
      limit 1;
    if v_nouveau is null then
      delete from public.khatms where id = k.id;
    else
      update public.khatms set createur = v_nouveau where id = k.id;
    end if;
  end loop;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
