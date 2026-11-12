# Recette avant chaque version

À dérouler sur appareils réels avant chaque envoi aux stores : au moins un iPhone récent, un petit iPhone (SE), un Android haut de gamme et un Android d'entrée de gamme (Tecno, Infinix ou Samsung série A), car ce sont eux qui coupent les tâches de fond et révèlent les lenteurs.

## Thèmes et confort

- [ ] Chaque écran dans les trois thèmes : `jour`, `nuit`, `veille` ; aucune couleur codée en dur, aucun texte illisible.
- [ ] Ouverture de l'app la nuit depuis une notification de Fajr : aucun flash clair (démarrage sombre, Veille déjà active).
- [ ] Bascule automatique en Veille à Isha et retour à Fajr, y compris app ouverte.
- [ ] En plein soleil, luminosité au maximum : horaires, dépense du jour et boutons lisibles (thème `jour`).

## Tailles et langues

- [ ] Taille de texte maximale (iOS et Android) : rien de coupé, aucun bouton qui déborde, onglets lisibles.
- [ ] Petit écran (iPhone SE, 375 × 667 pt) et grand écran (6,9 pouces) ; Android avec barre de navigation à trois boutons et en gestes.
- [ ] Interface en français, en wolof, en arabe (RTL : flèche de retour retournée, listes et curseurs inversés, audio non inversé).
- [ ] Textes arabes : jamais tronqués, voyelles complètes, interligne respecté, lus avec la voix arabe par VoiceOver et TalkBack.

## Accessibilité

- [ ] VoiceOver et TalkBack : chaque bouton a un libellé, l'ordre de lecture suit l'écran, le compteur de dhikr annonce sa valeur.
- [ ] Zones tactiles de 44 × 44 pt au moins ; aucune information portée par la couleur seule.
- [ ] « Réduire les animations » : aucune animation non essentielle.

## Hors ligne et réseau

- [ ] Mode avion : Accueil, horaires, lecteur, recherche, favoris, dhikr, qibla, budget fonctionnent ; bandeau « Hors ligne » seulement là où une fonction manque.
- [ ] Téléchargement coupé puis repris ; place libre insuffisante : message clair.
- [ ] Khatm modifié hors ligne puis resynchronisé.

## Prières et notifications

- [ ] Horaires comparés à la mosquée de référence sur 7 jours, à Dakar et à Nouakchott ; écart de 2 minutes au plus après ajustement.
- [ ] Notifications reçues à l'heure, téléphone verrouillé, app fermée, mode économie d'énergie, après redémarrage du téléphone.
- [ ] 12 jours sans ouvrir l'app : les rappels continuent (fenêtre replanifiée en arrière-plan) ; au-delà, l'app le dit à l'ouverture suivante.
- [ ] Changement de fuseau, de ville, de méthode : horaires et notifications recalculés.
- [ ] Qibla : aligné à ±3° avec une boussole de référence ; conseil de calibration quand la précision est faible.

## Budget

- [ ] Tests unitaires de `montant.ts`, `cycle.ts`, `zakat.ts` au vert.
- [ ] F CFA, ouguiya et une devise personnelle à 2 décimales : saisie, affichage, totaux exacts à l'unité.
- [ ] Jour de paie le 31, cycle de février, veille de la paie : dépense du jour correcte.
- [ ] Verrou : biométrie, code du téléphone, retour après 5 minutes ; aperçu masqué dans le sélecteur d'apps.
- [ ] Export CSV puis réimport d'une sauvegarde chiffrée : aucun écart.

## Comptes et données

- [ ] Suppression du compte depuis l'app : données serveur effacées, données du téléphone conservées, message final clair.
- [ ] Aucune donnée personnelle ni montant dans les rapports de plantage.

## Performance

- [ ] Démarrage à froid sous 2 s sur l'Android d'entrée de gamme (écran de démarrage compris).
- [ ] Défilement des 114 sourates et d'une longue sourate sans saccade ; recherche sous 300 ms.
- [ ] Taille de l'app installée notée à chaque version (textes embarqués, pas d'audio dans le paquet).

## Contenus

- [ ] Texte du Coran identique à la source (empreinte de `contenu.db` vérifiée), crédit Tanzil dans À propos.
- [ ] Toutes les traductions et récitations présentes ont leur autorisation enregistrée dans `sources`.
- [ ] Formules wolof relues par un locuteur ; formules religieuses validées par le référent.

## Dons

- [ ] Aucun écran de don dans le build iOS si la décision de la page Dons l'exige ; aucune fonction activée après la revue.
- [ ] Numéros et titulaires identiques à ceux des comptes réels, vérifiés par un envoi test sur chaque wallet.
- [ ] Déclaration hors ligne envoyée au retour du réseau ; référence en double refusée avec un message clair.

