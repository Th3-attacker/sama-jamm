# Dettes entre proches

Un petit carnet pour ne rien oublier de ce que l'on a prêté ou emprunté à un proche : un ami, un voisin, la famille. C'est un mémoire, pas un crédit : ni intérêt, ni pénalité, ni score, ni relance automatique. Il vit dans l'onglet Budget et reste sur le téléphone.

## Principes

- **Un mémoire, pas un crédit** : aucun champ d'intérêt, aucun calendrier imposé, aucune pénalité. L'app note ce qui a été convenu, rien de plus.
- **Deux sens, toujours écrits en mots** : « On me doit » (j'ai prêté) et « Je dois » (j'ai emprunté). Le sens ne repose jamais sur la couleur seule : un mot et une icône (`arrow-up` pour un prêt, `arrow-down` pour un emprunt) l'accompagnent. Les montants restent à l'encre, jamais en rouge ni en vert.
- **Doux** : une échéance passée s'écrit en `alerte` avec un mot (« Échéance passée depuis 12 jours »), jamais en écran rouge, jamais de reproche. Une dette soldée s'écrit « Soldée », sans fête ni confettis.
- **Simple** : une dette se crée en trois gestes (la personne, le montant, le sens) ; la date, l'échéance et la note sont facultatives.
- **Privé** : le nom d'un proche est une donnée personnelle d'un tiers. Il reste dans `budget.db` (chiffrée), n'est jamais synchronisé en v1, et ne sort que par un export que l'utilisateur confirme. L'app n'importe pas les contacts du téléphone ; le nom se saisit à la main. Les montants se masquent comme ceux du budget (toucher long).
- **À part du reste du budget** : une dette n'est ni une dépense ni une enveloppe. Elle ne change ni la dépense du jour, ni les plafonds, ni les comptes.

## Vie d'une dette

| Statut | Quand | Ce que l'écran dit |
| --- | --- | --- |
| `ouverte` | À la création, tant qu'il reste un montant | « Reste : 18 000 F CFA » + `ProgressBar` du déjà remboursé |
| `soldee` | Quand le reste atteint zéro (remboursement ou remise) | « Soldée », sortie des totaux, historique conservé |
| `annulee` | Saisie par erreur, via `Dialog` de confirmation | Retirée des totaux, historique consultable |

Deux sortes d'enregistrements sur une dette :

- **remboursement** : un montant rendu ou reçu, avec sa date et une note facultative. Plusieurs remboursements partiels sont normaux.
- **remise** : celui qui a prêté fait grâce de tout ou partie du reste. Elle réduit le reste comme un remboursement, mais n'est pas de l'argent reçu. Le libellé est « Faire remise du reste ». L'app ne la compte pas comme sadaqa : cette question est à trancher avec le référent religieux du projet.

## Calculs

```
paye          = somme des enregistrements (remboursements et remises) de la dette
reste         = montantInitial − paye
onMeDoit      = somme des reste des dettes ouvertes de sens « prete »
jeDois        = somme des reste des dettes ouvertes de sens « emprunte »
solde         = onMeDoit − jeDois
joursRestants = echeance − aujourd'hui ; négatif : « Échéance passée depuis N jours »
ratio         = paye / montantInitial
```

- Un enregistrement ne dépasse jamais le reste : sinon le champ affiche « Ce montant dépasse ce qui reste : 18 000 F CFA » et le bouton reste inactif.
- Les montants sont des entiers dans la plus petite unité de la devise du carnet, comme dans le budget (`montant.ts`, aucun calcul en virgule flottante). Une seule devise par carnet : pas de conversion en v1.
- Le solde peut être négatif (on doit plus qu'on ne nous doit) : il s'affiche avec son signe et un mot (« Vous devez plus que l'on ne vous doit »), pas en rouge.

## Modèle de données (`budget.db`)

À ajouter au schéma de la section Budget du foyer.

```sql
CREATE TABLE dettes     (id TEXT PRIMARY KEY, carnet_id TEXT NOT NULL REFERENCES carnets,
                         sens TEXT NOT NULL CHECK (sens IN ('prete','emprunte')),
                         personne TEXT NOT NULL CHECK (length(personne) BETWEEN 1 AND 60),
                         montant_initial INTEGER NOT NULL CHECK (montant_initial > 0),
                         date TEXT NOT NULL, echeance TEXT, note TEXT,
                         statut TEXT NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte','soldee','annulee')),
                         cree_le TEXT NOT NULL);
CREATE TABLE paiements_dette (id TEXT PRIMARY KEY, dette_id TEXT NOT NULL REFERENCES dettes ON DELETE CASCADE,
                         type TEXT NOT NULL DEFAULT 'remboursement' CHECK (type IN ('remboursement','remise')),
                         montant INTEGER NOT NULL CHECK (montant > 0), date TEXT NOT NULL, note TEXT,
                         cree_le TEXT NOT NULL);
CREATE INDEX dettes_statut ON dettes (carnet_id, statut, echeance);
CREATE INDEX paiements_dette_dette ON paiements_dette (dette_id, date);
```

- Identifiants UUID v7, dates ISO 8601 locales, comme le reste du budget.
- La somme des paiements d'une dette ne dépasse jamais `montant_initial` : à vérifier dans le code **et** par un test, car SQLite ne l'exprime pas simplement en contrainte.
- Passer en `soldee` est fait dans la même transaction que le dernier paiement.

## Écrans

Voir l'inventaire des écrans, section Dettes : liste, nouvelle dette, détail avec historique, feuille de remboursement. Accès depuis l'écran Budget (carte « Dettes » avec les deux totaux) et depuis les biens de la zakat. Composants existants uniquement : `ListItem`, `AmountDisplay`, `Keypad`, `SegmentedControl`, `Chip`, `ProgressBar`, `Badge`, `TextField`, `Dialog`, `EmptyState`, `Banner`.

## Rappels

- Une notification locale la veille de l'échéance, à 9 h heure locale, une seule par dette. Aucune relance répétée.
- Par défaut, la notification ne montre ni nom ni montant (« Une échéance de dette approche. »), car l'écran verrouillé peut être lu par d'autres. Un réglage « Afficher les détails dans les rappels » les montre.
- Notification refusée : un `Banner` renvoie aux réglages du téléphone ; la dette reste enregistrée.
- **Un mot à envoyer** : un bouton « Écrire un mot de rappel » prépare un message poli que l'utilisateur relit, modifie et envoie lui-même par la feuille de partage du système. L'app n'écrit jamais à la personne de sa propre initiative.

## Lien avec la zakat

- Le calcul de la zakat prend « les créances que l'on compte recouvrer » et déduit « les dettes à régler dans l'année » (section Budget du foyer).
- Sur l'écran des biens de la zakat, l'app **propose** les dettes ouvertes : chaque prêt ouvert comme `creance` (montant = reste), chaque emprunt ouvert comme `dette` (montant = reste, présélectionné s'il est dû dans l'année). L'utilisateur coche ce qu'il retient ; rien n'est ajouté sans son choix.
- Le calcul reste indicatif, avec le même renvoi vers un savant pour les cas particuliers.

## Textes

Clés du groupe `dettes`, à copier dans `i18n/fr.json` et `i18n/ar.json` au moment de construire les écrans. L'arabe est à faire relire par un arabophone ; le wolof n'est pas encore écrit (repli sur le français).

| Clé | Français | Arabe |
| --- | --- | --- |
| `titre` | Dettes | الديون |
| `sousTitre` | Entre proches, sans intérêt. | بين الأقارب، دون فوائد. |
| `onMeDoit` | On me doit | ما لي عند الناس |
| `jeDois` | Je dois | ما عليّ |
| `solde` | Solde | الصافي |
| `soldeNegatif` | Vous devez plus que l'on ne vous doit | عليك أكثر مما لك |
| `nouvelle` | Ajouter une dette | إضافة دين |
| `personne` | Personne | الشخص |
| `montant` | Montant | المبلغ |
| `sens` | Sens | النوع |
| `sensPrete` | J'ai prêté | أقرضتُ |
| `sensEmprunte` | J'ai emprunté | اقترضتُ |
| `date` | Date | التاريخ |
| `echeance` | Échéance (facultatif) | تاريخ الاستحقاق (اختياري) |
| `note` | Note (facultatif) | ملاحظة (اختياري) |
| `rembourser` | Enregistrer un remboursement | تسجيل سداد |
| `remise` | Faire remise du reste | التنازل عن المتبقي |
| `reste` | Reste : {{montant}} | المتبقي: {{montant}} |
| `soldee` | Soldée | مسدَّد |
| `echeanceAujourdhui` | Échéance aujourd'hui | الاستحقاق اليوم |
| `echeanceDans_one` / `_other` | Échéance dans {{count}} jour / jours | الاستحقاق بعد {{count}} يوم (six formes en arabe) |
| `echeancePassee_one` / `_other` | Échéance passée depuis {{count}} jour / jours | تجاوز الاستحقاق منذ {{count}} يوم (six formes en arabe) |
| `depasse` | Ce montant dépasse ce qui reste : {{montant}}. | هذا المبلغ يتجاوز المتبقي: {{montant}}. |
| `videTexte` | Aucune dette en cours. Ajoutez un prêt ou un emprunt pour ne rien oublier. | لا توجد ديون جارية. أضف قرضًا أو اقتراضًا حتى لا يفوتك شيء. |
| `annulerTitre` | Annuler cette dette ? | إلغاء هذا الدين؟ |
| `annulerTexte` | Elle ne comptera plus dans vos totaux. L'historique reste consultable. | لن تدخل في مجاميعك. يبقى السجل متاحًا. |
| `rappelDetails` | Afficher les détails dans les rappels | إظهار التفاصيل في التذكيرات |
| `rappelNotification` | Une échéance de dette approche. | يقترب موعد استحقاق دين. |
| `ecrireRappel` | Écrire un mot de rappel | كتابة رسالة تذكير |
| `messageRappel` | Salam {{personne}}, un petit mot au sujet des {{montant}} prêtés le {{date}}. Dites-moi quand cela vous arrange. | السلام عليكم {{personne}}، رسالة قصيرة بخصوص {{montant}} التي أقرضتُها بتاريخ {{date}}. أخبرني متى يناسبك. |

Le titre vide de l'écran est la formule wolof « Jàmm rekk. » (clé `formules.serenite`).

## Tests à écrire

- Calcul du reste, des totaux et du solde, y compris un solde négatif et des dettes soldées ou annulées exclues.
- Refus d'un paiement supérieur au reste ; passage en `soldee` au dernier paiement ; remise comptée comme un paiement.
- Échéance : aujourd'hui, demain, passée de 1 jour, passée de 45 jours, changement d'heure.
- Montants : entiers dans la plus petite unité pour F CFA, ouguiya et une devise à 2 décimales.
- Proposition à la zakat : un prêt ouvert devient `creance`, un emprunt ouvert devient `dette`, rien n'est ajouté sans choix.
