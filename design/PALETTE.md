# Palette Sama Jàmm

Source unique : `design/tokens.json`. Après toute modification, lancer `npm run tokens` pour régénérer `src/theme/tokens.generated.ts`.

Palette sobre : gris pierre, ardoise, vert sauge et laiton discret. Trois thèmes : Jour, Nuit (suit le mode sombre du téléphone), Veille (lecture nocturne atténuée).

| Rôle | Jour | Nuit | Veille |
|---|---|---|---|
| Fond | `#f7f7f5` | `#12161b` | `#0e1115` |
| Surface (cartes) | `#ffffff` | `#1a2027` | `#14191e` |
| Texte principal | `#1b2024` | `#e8eaec` | `#c9cdd0` |
| Accent principal (jeton `emeraude`) | `#1f5f4a` | `#7fc4ab` | `#72ad98` |
| Accent secondaire (jeton `or`) | `#b89a5e` | `#b89a5e` | `#a28955` |
| Texte accent secondaire (`orTexte`) | `#7a5f2e` | `#c9a96a` | `#bfa670` |

Couleurs de marque fixes, indépendantes du thème (icône, écran de démarrage, écran de langue) :
sauge `#1f5f4a`, laiton `#b89a5e`, pierre claire `#f7f7f5`, ardoise nuit `#12161b`.

## Contraste

Toutes les paires texte et fond des trois thèmes atteignent 4,5:1 (3:1 pour les lignes fortes), calculées par script le 2026-11-04. Ce calcul ne remplace pas un test visuel sur appareil, en plein soleil et la nuit.

## À savoir

- Les jetons gardent leurs anciens noms `emeraude` et `or` : ils désignent désormais du vert sauge et du laiton. Un renommage (par exemple `accent` et `accent2`) est possible plus tard, mais touche tous les écrans.
- `app.json` : fond de l'écran de démarrage `#f7f7f5` (clair) et `#12161b` (sombre), fond d'icône Android `#f7f7f5`. Un nouveau build natif est nécessaire pour les voir.
- Les images d'icône (`assets/images`) n'ont pas été remplacées.
- Les documents du design system hors du dépôt parlent encore de « vert profond et or » et restent à mettre à jour.
