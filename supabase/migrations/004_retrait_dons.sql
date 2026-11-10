-- Retrait des déclarations de dons : la fonction n'existe plus dans l'app.
-- À exécuter une fois, à la main : SQL Editor > New query > Run. Sans effet si la table n'a jamais été créée.
-- ATTENTION : supprime définitivement les déclarations déjà reçues. Les exporter d'abord depuis Table Editor
-- si elles doivent être gardées.

drop table if exists public.declarations_dons;
