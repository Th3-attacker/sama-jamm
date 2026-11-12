# Prières et rappels

Les horaires sont calculés sur le téléphone, sans serveur ; les rappels sont des notifications locales replanifiées en fenêtre glissante. Les réglages par défaut ci-dessous sont à faire valider par le référent religieux du projet avant publication.

## Calcul des horaires

- Bibliothèque `adhan` : `new PrayerTimes(new Coordinates(lat, lon), date, params)`.
- Paramètres par défaut : `CalculationMethod.MuslimWorldLeague()` (Fajr 18°, Isha 17°), `Madhab.Shafi` pour Asr (ombre simple, l'usage malikite), arrondi à la minute.
- Réglages (Prière › Méthode de calcul) : méthode (Ligue islamique mondiale, Autorité égyptienne, Umm al-Qura, UOIF, ISNA, personnalisée), école pour Asr, et un ajustement de −15 à +15 minutes par prière pour s'aligner sur la mosquée du quartier.
- Position : demandée une fois à la bienvenue, mémorisée ; recalcul si le téléphone s'est déplacé de plus de 25 km au retour au premier plan. Refus : ville choisie dans la liste embarquée `donnees/villes.json` (35 villes de Mauritanie et du Sénégal : nom français et arabe, région, latitude, longitude, fuseau, qibla), coordonnées à vérifier avant publication.
- Fuseau : celui du téléphone ; afficher la ville et l'heure locale si la ville choisie est dans un autre fuseau.
- Arc du jour (`DayArc`) : `lever` = `sunrise`, `coucher` = `maghrib` sans ajustement, `maintenant` mis à jour chaque minute.
- Date hégirienne : calendrier Umm al-Qura (`Intl.DateTimeFormat` avec `calendar: 'islamic-umalqura'` si le moteur le prend en charge, sinon table embarquée), avec un réglage de ±2 jours pour suivre l'observation locale du croissant.

## Notifications

- `expo-notifications`, uniquement locales. iOS garde au plus **64** notifications programmées par app : programmer 5 prières × 12 jours = 60, et garder 4 places (rappel de khatm, rappel de zakat, rappel de régularité si activé).
- Replanifier la fenêtre : à chaque ouverture, au retour au premier plan, après tout changement de réglage ou de position, et par une tâche d'arrière-plan quotidienne (`expo-background-task`). Annuler puis reprogrammer par identifiants stables (`priere-2026-10-29-asr`).
- Contenu :

| Moment | Titre | Texte |
| --- | --- | --- |
| Heure de la prière | Asr · 16:35 | Waxtu julli jot na. L'heure de la prière est arrivée. |
| Rappel avant (5 à 30 min, facultatif) | Asr dans 15 minutes | Préparez-vous en paix. |
| Fajr | Fajr · 06:05 | Waxtu julli jot na. La prière vaut mieux que le sommeil. |

- Sons : appel complet, appel court, son doux, vibration seule, silencieux ; choisi prière par prière (Prière › Appel et rappels). iOS : fichier de 30 s au plus dans le bundle (option `sounds` du plugin `expo-notifications`), sinon le son par défaut est joué. Android : un canal par son (le son d'un canal ne change plus après sa création) : `appel-complet`, `appel-court`, `doux`, `vibration`, `silencieux`.
- Android 12 et plus : sans l'autorisation d'alarme exacte, une notification peut arriver avec retard. Expliquer pourquoi l'heure exacte compte, puis ouvrir le réglage système ; vérifier sur appareils réels (Samsung, Tecno, Infinix, Xiaomi, très présents au Sénégal et en Mauritanie, coupent agressivement les tâches de fond).
- Refus des notifications : `Banner` sur Prière avec « Ouvrir les réglages du téléphone » ; jamais de nouvelle demande système automatique.
- Toucher une notification ouvre `samajamm://priere` ; entre Isha et Fajr, l'app s'ouvre déjà en Veille.

## Veille automatique

- Proposée à la bienvenue (écran Rappels), activable dans Réglages › Thème.
- Active de l'heure d'Isha à celle de Fajr, recalculée chaque jour ; le thème manuel l'emporte toujours.
- Pas de notification au passage en Veille ; un `Banner` « Veille activée · Fanaanal ak jàmm. » une fois par nuit, fermable.

## Qibla

- Relèvement : grand cercle vers la Kaaba (21,4225 N ; 39,8262 E), `Qibla(coordinates)` d'`adhan`. Exemples : Dakar 74°, Nouakchott 76°, Saint-Louis 75°.
- Cap : `Location.watchHeadingAsync` ; utiliser `trueHeading` quand il vaut 0 ou plus, sinon `magHeading`. Lisser sur 200 ms pour que l'étoile ne tremble pas.
- `accuracy` faible : `Banner info` « Boussole imprécise ? Éloignez-vous des objets métalliques et dessinez un 8 avec le téléphone. »
- Aligné à ±3° : anneau émeraude, une seule vibration (`Haptics.notificationAsync(Success)`), consigne « Vous faites face à la qibla ».
- Appareil sans boussole : afficher le relèvement en degrés et le point cardinal (« 74°, est-nord-est »).

## Dhikr

- `TasbihCounter` : un toucher = un grain, vibration légère à chaque grain, vibration de succès à l'objectif, `Toast` « Sant Yàlla. ».
- Formules proposées : Subḥāna-llāh (33), Al-ḥamdu li-llāh (33), Allāhu akbar (34), Lā ilāha illa-llāh (100), Astaghfiru-llāh (100), et une formule libre. Arabe, translittération et sens en français et en wolof.
- Le compte est enregistré à chaque grain (`utilisateur.db`) et reprend où il en était ; remettre à zéro au-delà de 100 demande une confirmation (`Dialog`).
- L'écran reste allumé pendant le dhikr (`expo-keep-awake`).
