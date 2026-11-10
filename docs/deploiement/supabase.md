# Supabase avant la publication

Projet dédié `sama-jamm` : `nfyrsfgtyxlbwivjpbjh` (URL et clé publique dans `src/services/supabase/client.ts`). Ne jamais utiliser le projet d’une autre app : les comptes seraient partagés. Tout ce qui suit se fait dans le tableau de bord, par toi.

## 1. Base de données
1. SQL Editor : exécuter `001_comptes.sql` puis `002_khatm.sql` (vérifier d'abord dans Table Editor ce qui existe déjà). Si la table `declarations_dons` existe, exécuter aussi `004_retrait_dons.sql` : les dons ont été retirés de l'app.
2. Exécuter `supabase/verification.sql` (lecture seule) et comparer aux résultats attendus indiqués en commentaire.
3. Database › Security Advisor (ou Advisors) : corriger tout avertissement de RLS manquant.

## 2. Connexion Google
1. Google Cloud Console : créer un identifiant OAuth (type Web) ; URI de redirection = `https://nfyrsfgtyxlbwivjpbjh.supabase.co/auth/v1/callback`.
2. Supabase › Authentication › Providers › Google : activer, coller identifiant et secret.
3. Authentication › URL Configuration : ajouter `samajamm://auth` aux Redirect URLs.

## 3. Connexion Apple (nécessite le compte Apple Developer)
1. Apple Developer : identifiant d'app `com.samajamm.app` avec la capacité « Sign in with Apple ».
2. Supabase › Providers › Apple : activer et ajouter `com.samajamm.app` aux identifiants clients autorisés (flux avec jeton natif). **À VALIDER** dans la documentation Supabase du moment.

## 4. Email
Si des emails partent (confirmation, etc.) : configurer un SMTP à toi dans Authentication › SMTP Settings (le service par défaut est très limité). Email d'expéditeur : **À FOURNIR**.

## 5. Test de la suppression de compte
1. Créer un compte test dans l'app, rejoindre un khatm, prendre un juz.
2. Plus › Réglages › Supprimer mon compte.
3. Vérifier : plus de ligne dans `auth.users`, `profils`, `khatm_membres` pour ce compte ; ses parts de khatm sont libres.

## 6. Exploitation
- Noter la région d'hébergement (à mettre dans la politique de confidentialité).
- Vérifier le plan et les sauvegardes (Database › Backups).
- Vérifier qu'aucune clé `service_role` n'est dans le dépôt (`git grep service_role`).
