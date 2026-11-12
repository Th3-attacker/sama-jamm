# Lecture et audio

Le Coran, les xassaïdes et les invocations sont embarqués dans `contenu.db` et se lisent sans réseau ; les récitations se téléchargent. Aucun texte ni enregistrement n'entre dans l'app sans sa licence notée dans la table `sources`.

## Droits des contenus

| Contenu | Source envisagée | Condition connue | À faire |
| --- | --- | --- | --- |
| Texte arabe du Coran | Tanzil (texte uthmani) | Creative Commons Attribution 3.0 ; copie à l'identique seulement, aucune modification ; citer Tanzil.net | Créditer dans À propos ; ne jamais retoucher le texte |
| Traduction du Coran | Aucune | Décision du 11 novembre 2026 : le Coran s'affiche en arabe seul | Rien à intégrer |
| Sens des invocations et des xassaïdes (français) | À choisir | Les traductions publiées sont protégées par le droit d'auteur | Autorisation écrite ou texte rédigé et validé par le référent religieux |
| Translittération | À choisir | Varie selon la source | Vérifier la licence avant import |
| Xassaïdes (textes) | Éditions des dahiras et associations | Les textes anciens peuvent être libres, pas forcément leur transcription ni leur édition | Autorisation de l'édition utilisée |
| Récitations et chants (audio) | Récitateurs, kurel, sites spécialisés | Droits propres à chaque enregistrement | Autorisation par récitateur ou ensemble, conservée avec la source |

Chaque ligne de `sources` porte : nom, auteur, licence, lien, texte d'attribution, date de l'autorisation. L'écran Réglages › À propos liste toutes les sources.

## Modèle de `contenu.db`

| Table | Champs |
| --- | --- |
| `livres` | `id` (`coran`, `xassaides`, `invocations`), `nom` |
| `chapitres` | `id`, `livre_id`, `numero`, `nom_ar`, `nom_translit`, `nom_fr`, `nom_wo`, `nb_versets`, `revelation` (Mecque, Médine) |
| `versets` | `id`, `chapitre_id`, `numero`, `arabe`, `translit`, `juz`, `hizb`, `page`, `sajda` |
| `sens` | `cible_type` (`invocation`, `vers`), `cible_id`, `langue` (`fr`, `ar`), `source_id`, `texte` ; aucune ligne pour le Coran |
| `sources` | `id`, `nom`, `auteur`, `licence`, `url`, `attribution`, `autorise_le` |
| `recherche` | table virtuelle FTS5 : `cible_type`, `cible_id`, `arabe_norm`, `translit_norm` |
| `pistes` | `id`, `recitateur_id`, `chapitre_id`, `url`, `taille`, `duree`, `minutage` (début de chaque verset, en ms) |

## Recherche

- Plein texte FTS5, sans réseau, en arabe et en translittération ; résultats groupés par livre, le verset ouvert à sa place exacte.
- Normalisation arabe à l'indexation et à la saisie : retirer les voyelles et signes de récitation, unifier les alifs (أ إ آ ٱ → ا), ة → ه, ى → ي.
- Translittération : sans signes ni casse ; « rahim » trouve « raḥīm », « kahf » trouve « kahf », « ʿ » et « ʾ » sont ignorés.
- Saisie phonétique tolérée pour les noms de sourates : « kahf », « yasin », « fatiha ».

## Lecteur

- Deux modes : **verset par verset** (`ReadingCard` : arabe, puis translittération si elle est activée) et **page** (texte arabe continu, médaillons de versets, comme un mushaf, avec réglette au toucher).
- Le Coran s'affiche en arabe seul : aucune traduction sous les versets.
- Réglages directs (icône `type`) : taille du texte arabe, translittération oui ou non (non par défaut), chiffres arabes ou latins.
- Marqueurs : début de juz et de hizb (`Ornament` séparateur), prosternation (sajda) signalée par un mot sous le verset.
- Reprise : position enregistrée au verset près à chaque défilement arrêté ; « Reprendre » sur Accueil.
- Basmala en tête de chaque sourate sauf At-Tawba ; Al-Fâtiha la compte comme verset 1.
- Le texte sacré n'est jamais coupé : pas de `numberOfLines`, pas de troncature, défilement seulement.

## Fil de régularité

- Un jour compte dès qu'un verset, une invocation ou un chant a été lu ou écouté au moins 30 secondes.
- `BeadThread` montre le mois en cours ; le résumé compte les jours faits (« 12 jours de lecture en octobre »), jamais une série.

## Audio

- Lecture en arrière-plan et écran verrouillé, avec titre (« Al-Kahf · verset 10 »), récitateur et pochette (nom arabe de la sourate sur émeraude) dans les commandes du système ; une sourate est jouée comme une liste d'un fichier par verset, si bien que précédent et suivant changent de verset (voir Hors de l'app).
- Verset par verset : le minutage de la piste fait défiler et surligner le verset récité dans le lecteur plein écran.
- Vitesse 0,5 à 1,5 ; répéter un verset ou une sourate 1, 3, 5, 10 fois ou sans fin (mémorisation) ; minuterie 15, 30, 45, 60 minutes ou fin de sourate, avec un fondu de 10 secondes.
- Téléchargement par sourate ou par recueil, reprise après coupure, uniquement en Wi-Fi par défaut (réglable) ; place utilisée et suppression dans Plus › Téléchargements.
- Interruption (appel, autre app) : pause, puis reprise si le système le permet.
- Mini-lecteur `AudioPlayer` au-dessus des onglets tant qu'une piste est chargée.

## Partage

- Image : `VerseShareCard` rendue hors écran à 1080 × 1080 (1080 × 1350 au-delà de trois lignes d'arabe), fond émeraude ou nuit, partagée par `expo-sharing`.
- Texte : arabe, translittération si l'utilisateur l'a cochée, référence « Al-Kahf · 18:46 », lien `samajamm://lire/coran/18?verset=46`.
- Image : trois styles (émeraude, nuit, ivoire), format carré ou story ; la translittération est une option de l'écran de partage, désactivée par défaut.
- Formule wolof au moment du partage : « Nit nittay garabam. »
