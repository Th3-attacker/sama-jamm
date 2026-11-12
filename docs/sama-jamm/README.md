# Sama Jàmm · dossier de référence

Copie de travail des quatre livrables de conception, au 12 novembre 2026. Les règles d'usage sont dans `AGENTS.md`, à la racine du dépôt.

| Fichier ou dossier | Contenu |
| --- | --- |
| `fiche-technique.md` | Pour chaque partie de la maquette : composants de React Native d'abord, puis Expo, puis la communauté |
| `conception-du-systeme.md` | Couches de l'app, trois bases SQLite, serveur Supabase, flux, hors de l'app, sécurité, tests, décisions ouvertes (le schéma d'ensemble est remplacé par un texte : voir la version en ligne) |
| `design-system/README.md` | Charte : voix, couleurs, typographie, arabe, formes, mouvement, icônes, logo |
| `design-system/01-lire-d-abord.md` à `19-hors-de-l-app.md` | Pages de construction : architecture, jetons en React Native, navigation, inventaire des écrans (planche ↔ route), prière, lecture et audio, budget, dettes, langues, publication, recette, hors de l'app |
| `design-system/tokens.json` | Seule source des couleurs (trois thèmes), tailles, espaces, rayons, ombres |
| `design-system/i18n/` | Libellés `fr.json`, `ar.json`, `wo.json` |
| `design-system/components/` | Un `README.md` par composant, `index.d.ts` (contrat des props), `bundle.js` (référence web, à ne pas copier tel quel) |
| `design-system/donnees/villes.json` | Villes pour le choix manuel |
| `maquette/*.dc.html` | Les planches (référence visuelle et de contenu) ; `maquette/canvas.json` donne le titre et la page de chaque planche |
| `ECARTS.md` | À créer et tenir par l'agent : écarts trouvés, choix faits, dépendances ajoutées |

Pages de la maquette dans `canvas.json` : `identite`, `structure`, `ecrans`, `horsapp`. Les planches qui commencent par `Hors` sont celles de la page « Hors de l'app » ; `Ar…` est l'interface en arabe ; `Espace…` sont des règles de mise en page, pas des écrans.
