# Visuels et captures attendus

Tailles à confirmer sur les consoles au moment de l'envoi (elles évoluent). État du dépôt : `assets/images` contient `icon.png`, icônes Android (premier plan, fond, monochrome), `splash-icon(.png/-dark)`, `notification-icon.png`, `marque-ivoire.png`, `favicon.png`. Aucun visuel de store n'existe.

## Apple (App Store Connect)
- Icône 1024×1024 sans transparence (vérifier que `icon.png` fait cette taille).
- Disponibilité : iPhone/iPad sont publiés aussi sur Mac (Apple silicon) et Vision Pro par défaut ; décision : décocher Mac et Vision Pro dans la console (voir `checklist-soumission.md`).
- iPad : **non pris en charge** (`ios.supportsTablet: false`) ; aucune capture iPad à fournir.
- Captures iPhone : au moins un jeu pour la plus grande taille exigée (6,9″ ou 6,5″ selon la console).
- 3 à 10 captures par langue de fiche.

## Google Play (source : aide Google Play, « Add preview assets », vérifiée le 9 novembre 2026)
- Icône : 512×512 px, PNG 32 bits avec alpha, 1024 Ko maximum, sans badge ni texte de classement/prix.
- Image de présentation : 1024×500 px, JPEG ou PNG 24 bits **sans alpha**.
- Captures (téléphone et tablette) : JPEG ou PNG 24 bits sans alpha, côté court de 320 à 3840 px, côté long au plus le double du côté court. Au moins 2 captures en tout, 8 maximum par type d'appareil.
- Tablette 7″/10″ : 1080 à 7680 px, 16:9 ou 9:16, 4 recommandées.
- Vidéo : facultative, URL YouTube publique ou non répertoriée.
- Textes : nom 30, description courte 80, longue 4000 ; email de support obligatoire.

## Écrans conseillés (même ordre sur les deux stores)
1. Accueil. 2. Lecture du Coran (arabe + français). 3. Horaires de prière. 4. Qibla. 5. Dhikr / invocations. 6. Budget (données fictives). 7. Khatm collectif. 8. Mode sombre ou arabe (RTL).

## Règles
- Données fictives dans le budget, prénoms fictifs dans le khatm.
- Mêmes captures en français ; captures arabes une fois la traduction validée.
- Pas de bandeau de statut ni de mention d'un autre store.
