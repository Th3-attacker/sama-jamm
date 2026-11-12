# Budget du foyer

Un budget en enveloppes, sur le cycle de la paie, entièrement sur le téléphone : chaque matin, l'utilisateur sait combien il peut dépenser aujourd'hui, et son épargne alimente le calcul de la zakat. Ni intérêt, ni crédit, ni publicité, ni connexion bancaire.

## Principes

- **Épargner d'abord** : le jour de la paie, les versements d'épargne et la sadaqa sont mis de côté avant toute dépense.
- **La dépense du jour** guide tout l'écran : un seul chiffre, recalculé à chaque saisie.
- **Une enveloppe par poste** du foyer. Postes proposés : Dépense quotidienne, Loyer, Électricité et eau, Transport, Scolarité, Santé, Famille et entraide, Cérémonies, Sadaqa. L'utilisateur renomme, ajoute, archive.
- **Doux** : à 85 % d'une enveloppe, un mot en `alerte` ; au-delà de 100 %, un mot en `erreur` avec le montant du dépassement. Jamais d'écran rouge, jamais de reproche. Une dépense s'affiche à l'encre, pas en rouge.
- **Discret** : données chiffrées sur le téléphone, verrou biométrique en option, montants masquables d'un geste.

## Le cycle

1. **Jour de paie** (`BudgetPaie`) : l'utilisateur saisit le revenu reçu ; l'app propose la répartition du cycle précédent ; il ajuste ; le reste « non réparti » s'affiche jusqu'à zéro.
2. **Mise de côté** : versements vers les objectifs et l'enveloppe Sadaqa.
3. **Chaque jour** : une dépense en trois touches (montant au pavé, enveloppe, compte) dans `budget-ajout`.
4. **Fin de cycle** (`BudgetBilan`) : pour le reste de chaque enveloppe, reporter au cycle suivant (défaut), verser à un objectif ou donner en sadaqa.
5. **Une fois par année lunaire** : rappel de zakat si l'épargne est restée au-dessus du nisab.

Le cycle va du jour de paie au jour qui précède la paie suivante. Si le jour de paie n'existe pas dans le mois (31), prendre le dernier jour du mois.

## Calculs

```
resteAVivre   = recuDuCycle − misDeCoteDuCycle − depensesDuCycle − resteDesChargesFixesNonReglees
joursRestants = nombre de jours d'aujourd'hui (compris) à la veille de la prochaine paie
depenseDuJour = arrondiInferieur(resteAVivre / joursRestants, pas)
```

- `pas` d'arrondi : 100 unités pour le F CFA et l'ouguiya, 1 unité principale pour une devise à décimales. Si `resteAVivre` est négatif, afficher « 0 » et le dépassement total en dessous.
- Exemple du canevas : reçu 350 000, mis de côté 40 000, dépensé 172 500, charges fixes réglées → reste 137 500 pour 27 jours (29 octobre au 24 novembre) → **5 000 F CFA** aujourd'hui.
- État d'une enveloppe : `ratio = depense / plafond` ; normal sous 0,85 ; presque plein de 0,85 à 1 ; dépassé au-delà de 1 ; une enveloppe `fixe` pleine est « Réglée pour ce cycle ».

## Argent : toujours des entiers

- Stocker chaque montant en entier dans la plus petite unité de la devise ; aucune colonne `REAL`, aucun calcul en virgule flottante sur l'argent.
- Plus petite unité : F CFA (XOF) = 1 franc ; ouguiya (MRU) = 1 khoum, soit 5 par ouguiya ; devise personnelle à 2 décimales = 100 par unité.
- `src/lib/montant.ts` expose `versMinimes(saisie, devise)`, `versPrincipal(minimes, devise)` et `formatMontant(montant, devise)`, identique à celui du design system : espace fine insécable entre milliers, virgule décimale, symbole après (ou avant si la devise le dit).

| Entrée | Devise | Stocké | Affiché |
| --- | --- | --- | --- |
| « 2500 » | XOF | 2500 | 2 500 F CFA |
| « 18500 » | MRU | 92500 | 18 500 UM |
| « 12,50 » | DH (2 décimales, après) | 1250 | 12,50 DH |
| « 9,99 » | $ (2 décimales, avant) | 999 | $ 9,99 |

## Devises

- Réglages › Budget › Devise (`BudgetDevise`) : franc CFA (XOF) et ouguiya (MRU) intégrés ; « Ajouter une devise » : nom, symbole (4 caractères au plus), position avant ou après, 0 à 2 décimales, aperçu en direct.
- Une devise par carnet. En changer quand des opérations existent ouvre une `Dialog` : convertir avec un taux saisi par l'utilisateur, ou ouvrir un nouveau carnet. Aucun taux n'est cherché en ligne.

## Modèle de données (`budget.db`, SQLCipher)

```sql
CREATE TABLE devises    (code TEXT PRIMARY KEY, nom TEXT NOT NULL, symbole TEXT NOT NULL,
                         position TEXT NOT NULL CHECK (position IN ('avant','apres')),
                         decimales INTEGER NOT NULL CHECK (decimales BETWEEN 0 AND 2),
                         sous_unites INTEGER NOT NULL, personnelle INTEGER NOT NULL DEFAULT 0);
CREATE TABLE carnets    (id TEXT PRIMARY KEY, nom TEXT NOT NULL, devise_code TEXT NOT NULL REFERENCES devises,
                         jour_paie INTEGER NOT NULL CHECK (jour_paie BETWEEN 1 AND 31));
CREATE TABLE comptes    (id TEXT PRIMARY KEY, carnet_id TEXT NOT NULL REFERENCES carnets, nom TEXT NOT NULL,
                         type TEXT NOT NULL CHECK (type IN ('especes','mobile','banque')), solde_initial INTEGER NOT NULL DEFAULT 0);
CREATE TABLE cycles     (id TEXT PRIMARY KEY, carnet_id TEXT NOT NULL REFERENCES carnets,
                         debut TEXT NOT NULL, fin TEXT NOT NULL, clos INTEGER NOT NULL DEFAULT 0);
CREATE TABLE enveloppes (id TEXT PRIMARY KEY, carnet_id TEXT NOT NULL REFERENCES carnets, nom TEXT NOT NULL,
                         icone TEXT NOT NULL, fixe INTEGER NOT NULL DEFAULT 0, ordre INTEGER NOT NULL, archivee INTEGER NOT NULL DEFAULT 0);
CREATE TABLE plafonds   (cycle_id TEXT NOT NULL REFERENCES cycles, enveloppe_id TEXT NOT NULL REFERENCES enveloppes,
                         montant INTEGER NOT NULL CHECK (montant >= 0), report INTEGER NOT NULL DEFAULT 0,
                         PRIMARY KEY (cycle_id, enveloppe_id));
CREATE TABLE objectifs  (id TEXT PRIMARY KEY, carnet_id TEXT NOT NULL REFERENCES carnets, nom TEXT NOT NULL, intention TEXT,
                         cible INTEGER, versement_mensuel INTEGER, echeance TEXT, icone TEXT NOT NULL, archive INTEGER NOT NULL DEFAULT 0);
CREATE TABLE operations (id TEXT PRIMARY KEY, carnet_id TEXT NOT NULL REFERENCES carnets, cycle_id TEXT NOT NULL REFERENCES cycles,
                         type TEXT NOT NULL CHECK (type IN ('depense','revenu','virement','epargne','sadaqa')),
                         montant INTEGER NOT NULL CHECK (montant > 0), date TEXT NOT NULL,
                         enveloppe_id TEXT REFERENCES enveloppes, compte_id TEXT REFERENCES comptes,
                         compte_dest_id TEXT REFERENCES comptes, objectif_id TEXT REFERENCES objectifs,
                         note TEXT, recurrence TEXT, cree_le TEXT NOT NULL);
CREATE TABLE zakat      (carnet_id TEXT PRIMARY KEY REFERENCES carnets, debut_hawl TEXT,
                         base_nisab TEXT NOT NULL DEFAULT 'or' CHECK (base_nisab IN ('or','argent')),
                         cours_or_g INTEGER, cours_argent_g INTEGER, cours_maj_le TEXT);
CREATE TABLE biens_zakat(id TEXT PRIMARY KEY, carnet_id TEXT NOT NULL REFERENCES carnets,
                         type TEXT NOT NULL CHECK (type IN ('or','argent','creance','dette','autre')),
                         libelle TEXT, montant INTEGER, milligrammes INTEGER);
CREATE INDEX operations_cycle ON operations (cycle_id, date);
```

- Identifiants : UUID v7 (triables par date). Dates : ISO 8601 locale (`2026-10-29`).
- Une opération ne change jamais de devise ; un virement vers l'épargne est une opération `epargne` liée à un objectif.

## Zakat

- **Base** : épargne (objectifs et comptes) + valeur de l'or et de l'argent détenus + créances que l'on compte recouvrer − dettes à régler dans l'année. Les prêts et emprunts ouverts du carnet de dettes sont proposés comme créances et dettes, l'utilisateur coche ce qu'il retient.
- **Nisab** : valeur de 85 g d'or, ou de 595 g d'argent selon l'avis retenu par le référent religieux (réglage `base_nisab`). Cours au gramme saisi à la main, mis à jour quand le réseau le permet ; la date du cours est toujours affichée.
- **Année lunaire (hawl)** : commence le jour où la base atteint le nisab ; à son terme (354 ou 355 jours), si la base est toujours au-dessus, la zakat due vaut **2,5 %** de la base. Exemple : base 1 250 000 F CFA → 31 250 F CFA.
- Le calcul est indicatif : l'écran le dit (`Banner info`) et renvoie vers un savant pour les cas particuliers (biens commerciaux, bétail, récoltes).

## Dettes entre proches

Un carnet à part pour les prêts et emprunts entre proches, sans intérêt ni pénalité : règles, calculs, tables `dettes` et `paiements_dette`, rappels et textes dans la section « Dettes entre proches ». Une dette n'est pas une dépense : elle ne touche ni la dépense du jour, ni les plafonds. Ses créances et ses dettes ouvertes sont proposées au calcul de la zakat.

## Sécurité

- Base SQLCipher, clé aléatoire de 256 bits gardée dans `expo-secure-store` ; verrou par `expo-local-authentication` (biométrie ou code du téléphone), qui retombe après 5 minutes en arrière-plan.
- Masquer les montants : un toucher long sur la dépense du jour remplace tous les chiffres par « ••• » jusqu'au prochain toucher.
- Export : CSV en clair (après confirmation) ou sauvegarde chiffrée par un mot de passe choisi par l'utilisateur.
- Quand le verrou est actif, masquer l'aperçu de l'app dans le sélecteur d'apps (`expo-screen-capture`, protection du sélecteur sur iOS ; `FLAG_SECURE` sur Android, qui bloque aussi les captures, à proposer en option).

## Tests à écrire

- `montant.ts` : le tableau ci-dessus, les arrondis, les montants négatifs, les très grands montants (jusqu'à 10¹² unités).
- `cycle.ts` : jour de paie le 31, mois de février, changement d'heure, cycle de 28 à 31 jours, aujourd'hui = veille de la paie (1 jour restant).
- `zakat.ts` : base sous et au-dessus du nisab, dettes supérieures à l'épargne, hawl interrompu.
