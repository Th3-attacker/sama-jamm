# Palette Sama Jàmm

Source unique : `design/tokens.json`. Après toute modification, lancer `npm run tokens` pour régénérer `src/theme/tokens.generated.ts`.

Palette sobre : gris pierre, ardoise, vert sauge et laiton discret. Deux thèmes : Jour et Nuit (suit le mode sombre du téléphone). La Nuit reprend l'apparence de l'ancienne Veille, plus atténuée ; il n'y a plus de bascule automatique entre Isha et Fajr.

| Rôle | Jour | Nuit |
|---|---|---|
| Fond | `#f7f7f5` | `#0e1115` |
| Surface (cartes) | `#ffffff` | `#14191e` |
| Texte principal | `#1b2024` | `#c9cdd0` |
| Accent principal (jeton `emeraude`, texte et contours) | `#1f5f4a` | `#72ad98` |
| Aplat émeraude (jeton `emeraudeAplat`, bouton principal, carte, compteur) | `#1f5f4a` | `#245747` |
| Accent secondaire (jeton `or`) | `#b89a5e` | `#a28955` |
| Texte accent secondaire (`orTexte`) | `#7a5f2e` | `#bfa670` |

Couleurs de marque fixes, indépendantes du thème (icône, écran de démarrage, écran de langue) :
sauge `#1f5f4a`, laiton `#b89a5e`, pierre claire `#f7f7f5`, ardoise nuit `#12161b`.

## Contraste

Les valeurs nuit de fond, surface, texte, lignes et or ont changé avec la palette Émeraude & pierre : le contrôle du 2026-11-04 n'est plus valable pour le nuit et doit être recalculé.

Toutes les paires texte et fond des trois thèmes atteignent 4,5:1 (3:1 pour les lignes fortes), calculées par script le 2026-11-04. Ce calcul ne remplace pas un test visuel sur appareil, en plein soleil et la nuit.

## À savoir

- Les jetons gardent leurs anciens noms `emeraude` et `or` : ils désignent désormais du vert sauge et du laiton. Un renommage (par exemple `accent` et `accent2`) est possible plus tard, mais touche tous les écrans.
- `app.json` : fond de l'écran de démarrage `#f7f7f5` (clair) et `#12161b` (sombre), fond d'icône Android `#f7f7f5`. Un nouveau build natif est nécessaire pour les voir.
- Les images d'icône (`assets/images`) n'ont pas été remplacées.
- Les documents du design system hors du dépôt parlent encore de « vert profond et or » et restent à mettre à jour.
