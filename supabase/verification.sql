-- Vérification de l'installation Supabase de Sama Jàmm. LECTURE SEULE : aucun changement de données.
-- À exécuter dans SQL Editor après les migrations 001, 002 et 004, puis comparer avec les résultats attendus.

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

-- 5. Fournisseurs de connexion : à contrôler dans le tableau de bord (Authentication > Providers), pas en SQL.
