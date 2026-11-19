-- Audio des adhkar : bucket public en lecture seule (59 fichiers MP3, environ 33 Mo, le plus lourd 1,9 Mo).
-- Indépendant des migrations 009 à 011. À exécuter une fois : SQL Editor > New query > Run.
-- Aucune règle d'écriture pour les clients : l'envoi des fichiers se fait depuis le tableau de bord (rôle serveur).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('adhkar', 'adhkar', true, 3145728, array['audio/mpeg'])
on conflict (id) do nothing;

drop policy if exists "adhkar : lecture publique" on storage.objects;
create policy "adhkar : lecture publique"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'adhkar');
