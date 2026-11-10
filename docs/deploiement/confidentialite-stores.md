# Déclarations de confidentialité des stores

Base : le code de la version 1.0.0. Aucun SDK de publicité, d'analyse ni de suivi n'est présent dans `package.json`. **À VALIDER** avant envoi, surtout la collecte automatique de Supabase, d'Expo Updates et de Google/Apple sign-in.

## Apple – App Privacy
Suivi (tracking) : **Non**.

| Donnée | Collectée ? | Liée à l'identité ? | Finalité |
| --- | --- | --- | --- |
| Adresse email (via Apple/Google) | Oui, si compte | Oui | Fonctionnalités de l'app (compte) |
| Nom (prénom facultatif) | Oui, si saisi | Oui | Fonctionnalités de l'app |
| Identifiant utilisateur | Oui, si compte | Oui | Fonctionnalités de l'app |
| Autre contenu (nom de khatm, intention) | Oui, si utilisé | Oui | Fonctionnalités de l'app |
| Achats / informations de paiement | Non (aucun paiement ni don dans l'app) | — | — |
| Localisation précise | Non collectée (traitée sur l'appareil) | — | — |
| Données du budget | Non (restent sur l'appareil) | — | — |
| Identifiants d'appareil, diagnostics | À VALIDER (Expo Updates, journal d'erreurs partagé manuellement) | — | — |

Chiffrement : `ITSAppUsesNonExemptEncryption = false` déjà posé dans `app.json`. Connexion avec Apple : proposée parce que Google l'est (exigence Apple), `usesAppleSignIn` actif.
Suppression de compte in-app : présente.

## Google Play – Data safety
- Données partagées avec des tiers : **aucune vente**. Fournisseurs de service (Supabase) : traitement pour notre compte.
- Chiffrement en transit : **Oui** (HTTPS).
- Suppression des données : **Oui**, dans l'app (Plus › Réglages › Supprimer mon compte) ; URL web de suppression exigée par Google : **À VALIDER (à fournir)**.
- Données collectées : email, nom/prénom facultatif, identifiant utilisateur, autre contenu (khatm). Position : **non collectée** (calcul local), mais l'autorisation est demandée « pendant l'utilisation ».
- Facultatif / obligatoire : tout est facultatif (l'app marche sans compte).
- Permissions : localisation approximative/précise (au premier plan), notifications, alarmes exactes (`SCHEDULE_EXACT_ALARM`, justification à fournir à Google : rappels de prière), biométrie. Aucune autorisation micro (désactivée dans `app.json`).
- Déclaration « Public cible » : adultes et grand public, hors enfants. **À VALIDER**.
- Formulaires complémentaires attendus par Google : usage des alarmes exactes, contenu de l'app, publicités (aucune), applications financières (aucune fonction de prêt/paiement).
