-- Vérification de l'installation Supabase de Sama Jàmm. LECTURE SEULE : aucun changement de données.
-- À exécuter dans SQL Editor après les migrations 001, 002 et 004 (010 pour la section 5, 011 pour la section 6), puis comparer avec les résultats attendus.

-- 1. Tables attendues et état RLS (rls_active doit être true pour les 4).
select c.relname as table, c.relrowsecurity as rls_active
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in ('profils', 'khatms', 'khatm_membres', 'khatm_parts')
order by 1;
-- Attendu : 4 lignes, toutes à true.

-- 2. Règles d'accès (policies) par table.
select tablename, policyname, cmd, roles
from pg_policies where schemaname = 'public' order by tablename, cmd;
-- Attendu : aucune règle pour declarations_dons (table retirée) ; aucune table n'a de règle DELETE pour anon.

-- 3. Fonctions attendues (security definer) et droits d'exécution.
select p.proname as fonction, p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'execute') as anon_peut,
       has_function_privilege('authenticated', p.oid, 'execute') as connecte_peut
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('prenom_courant', 'creer_khatm', 'apercu_khatm', 'rejoindre_khatm', 'prendre_juz',
                    'rendre_juz', 'marquer_juz_lu', 'quitter_khatm', 'supprimer_mon_compte', 'est_membre')
order by 1;
-- Attendu : 10 lignes. supprimer_mon_compte : anon_peut = false, connecte_peut = true.

-- 4. Tables du schéma public SANS RLS (doit être vide).
select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 5. Limite des essais de code (migration 010) : compteur commun à l'aperçu et à l'adhésion.
select p.proname as fonction, p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=""%' as search_path_vide,
       p.prosrc like '%noter_tentative_code()%' as quota_appele,
       has_function_privilege('anon', p.oid, 'execute') as anon_peut,
       has_function_privilege('authenticated', p.oid, 'execute') as connecte_peut
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('apercu_khatm', 'rejoindre_khatm', 'noter_tentative_code')
order by 1;
-- Attendu : 3 lignes, security_definer = true et search_path_vide = true partout ; anon_peut = false partout.
-- apercu_khatm et rejoindre_khatm : quota_appele = true, connecte_peut = true.
-- noter_tentative_code : connecte_peut = false (usage interne seulement).

select p.prosrc like '%pg_advisory_xact_lock%' as verrou_par_personne,
       p.prosrc like '%>= 30%' as limite_30,
       p.prosrc like '%trop de tentatives, réessayez plus tard%' as message_quota
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'noter_tentative_code';
-- Attendu : 1 ligne, trois fois true.

-- 6. Retrait de membre durable (migration 011) : table des exclus et fonctions qui la lisent et l'écrivent.
select c.relname as table_, c.relrowsecurity as rls_active,
       has_table_privilege('authenticated', c.oid, 'select') as connecte_lit,
       has_table_privilege('anon', c.oid, 'select') as anon_lit,
       (select count(*) from pg_policies q where q.schemaname = 'public' and q.tablename = c.relname) as regles
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'khatm_exclus';
-- Attendu : 1 ligne, rls_active = true, connecte_lit = false, anon_lit = false, regles = 0.

select p.proname as fonction, p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=""%' as search_path_vide,
       p.prosrc like '%khatm_exclus%' as exclusions_utilisees,
       has_function_privilege('anon', p.oid, 'execute') as anon_peut
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('apercu_khatm', 'retirer_membre', 'rejoindre_khatm')
order by 1;
-- Attendu : 3 lignes (apercu_khatm, rejoindre_khatm, retirer_membre), security_definer, search_path_vide et
-- exclusions_utilisees = true ; anon_peut = false.

-- 7. Fournisseurs de connexion : à contrôler dans le tableau de bord (Authentication > Providers), pas en SQL.
