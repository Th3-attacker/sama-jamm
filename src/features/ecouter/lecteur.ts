// Lecteur audio unique de l'app : écoute verset par verset, jusqu'à la fin de la sourate ou page par page,
// et écoute des xassaïdes (une piste longue par fichier).
// État partagé par l'onglet Écouter, le lecteur plein écran et le mini-lecteur ; dernière position gardée.
import { createAudioPlaylist, setAudioModeAsync, type AudioPlaylist, type AudioPlaylistStatus } from 'expo-audio';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { nombreDePages, pageDe, sourate, sourates, versetsDePage } from '@/features/lire/coran';
import { pisteXassaides, sourceXassaides } from '@/features/xassaides/catalogue';
import { tempsApresSaut, type Piste, type PisteEnCours } from '@/features/xassaides/pistes';
import { sourcePiste } from '@/features/xassaides/telechargements';
import { stockage } from '@/stores/stockage';

import { rejouerVerset, resteMinuterie, type Minuterie, type RepetitionVerset } from './minuterie';
import { positionValide, recitateur, RECITATEURS, pistesDePages, type Position } from './recitateurs';
import { erreurDuStatut, indexDuStatut } from './statut';
import { sourceVerset } from './telechargements';

const VERSETS = sourates.map((s) => s.versets);
export const VITESSES = [0.5, 0.75, 1, 1.25, 1.5] as const;

type EtatLecteur = {
  /** Verset en cours d'écoute, ou null si rien n'est chargé. */
  position: Position | null;
  /** Dernier verset écouté, pour « Reprendre » (gardé sur le téléphone). */
  derniere: Position | null;
  /** Xassaïde en cours d'écoute ; `position` vaut alors null. */
  piste: PisteEnCours | null;
  /** Temps écoulé dans la piste en cours, en secondes entières ; `duree` n'est mesurée que pour les xassaïdes. */
  temps: number;
  duree: number;
  recitateur: string;
  vitesse: number;
  enLecture: boolean;
  chargement: boolean;
  /** Page du mushaf récitée, en écoute page par page (sinon null). */
  page: number | null;
  /** Le fichier n'a pas pu être lu (réseau). */
  erreur: boolean;
  minuterie: Minuterie;
  /** Écoutes de chaque verset : 1, 3, 5, ou 0 pour sans fin. */
  repetitionVerset: RepetitionVerset;
  /** Recommencer la sourate à la fin (écoute par sourate). */
  repeterSourate: boolean;
};

export const useLecteur = create<EtatLecteur>()(
  persist(
    (): EtatLecteur => ({
      position: null,
      derniere: null,
      piste: null,
      temps: 0,
      duree: 0,
      recitateur: RECITATEURS[0]?.id ?? 'ar.alafasy',
      vitesse: 1,
      enLecture: false,
      chargement: false,
      page: null,
      erreur: false,
      minuterie: { type: 'aucune' },
      repetitionVerset: 1,
      repeterSourate: false,
    }),
    {
      name: 'lecteur',
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ derniere, recitateur: r, vitesse, repetitionVerset, repeterSourate }) => ({
        derniere,
        recitateur: r,
        vitesse,
        repetitionVerset,
        repeterSourate,
      }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Lecteur illisible : valeurs par défaut', erreur);
      },
    },
  ),
);

// Liste de lecture native (ExoPlayer, AVQueuePlayer) : les versets sont en file, le suivant est préparé pendant
// la lecture du verset en cours, d'où un enchaînement sans attente de chargement.
let liste: AudioPlaylist | undefined;
let abonnements: { remove: () => void }[] = [];
/**
 * Après un échec de chargement, la liste native ne repart plus (Android : ExoPlayer reste à l'arrêt, jamais
 * re-préparé par expo-audio). Elle est alors jetée et recréée à la prochaine lecture.
 */
let listeCassee = false;
/** Piste en cours dans la file, pour reprendre au même endroit après un échec. */
let indexCourant = 0;
/** Relances automatiques après un échec pendant une écoute continue (coupure réseau brève). */
const RELANCES_AUTO = 1;
let relances = 0;
type FileCoran =
  | { mode: 'sourate'; sourate: number; recitateur: string; pistes: Position[] }
  | { mode: 'page'; dernierePage: number; recitateur: string; pistes: Position[] };
type FileXassaides = { mode: 'xassaides'; source: string; nomSource: string; pistes: readonly Piste[] };
/** Ce qui est en file : la sourate entière, des pages du mushaf ajoutées au fur et à mesure, ou les xassaïdes d'une source. */
let enFile: FileCoran | FileXassaides | null = null;
/** Pages ajoutées d'avance en mode page. */
const PAGES_D_AVANCE = 1;

/** Vrai pendant une écoute, du Coran ou d'un xassaïde. */
export const enEcoute = (s: EtatLecteur): boolean => s.position !== null || s.piste !== null;

function metadonnees(p: Position) {
  const r = recitateur(useLecteur.getState().recitateur);
  return { title: `${sourate(p.sourate)?.nom ?? ''} · ${p.verset}`, artist: r?.nom ?? '' };
}

/** État et titre de l'écran verrouillé pour la piste `index` de la file, ou null si elle n'existe pas. */
function pisteDeFile(f: FileCoran | FileXassaides, index: number) {
  if (f.mode === 'xassaides') {
    const x = f.pistes[index];
    if (!x) return null;
    return {
      etat: { position: null, page: null, piste: { source: f.source, id: x.id }, temps: 0, duree: 0 },
      titre: { title: x.titre, artist: f.nomSource },
    };
  }
  const p = f.pistes[index];
  if (!p) return null;
  return {
    etat: {
      position: p,
      derniere: p,
      page: f.mode === 'page' ? (pageDe(p.sourate, p.verset) ?? null) : null,
      piste: null,
    },
    titre: metadonnees(p),
  };
}

/** Délai de chargement au-delà duquel le verset est considéré comme injoignable (hors ligne). */
const DELAI_RESEAU_MS = 15_000;
let attenteReseau: ReturnType<typeof setTimeout> | undefined;
let lectureDemandee = false;

/** Échec de chargement : une relance automatique au même endroit, puis l'erreur affichée. */
function echecLecture(raison: string, index: number): void {
  clearTimeout(attenteReseau);
  attenteReseau = undefined;
  listeCassee = true;
  indexCourant = index;
  console.warn('Lecture interrompue', raison);
  if (lectureDemandee && relances < RELANCES_AUTO) {
    relances += 1;
    // Courte pause : le lecteur natif finit de signaler son échec avant d'être jeté.
    setTimeout(() => {
      if (listeCassee && lectureDemandee) relancer();
    }, 1000);
    return;
  }
  lectureDemandee = false;
  liste?.pause();
  useLecteur.setState({ erreur: true, enLecture: false, chargement: false });
}

function surStatut(statut: AudioPlaylistStatus): void {
  const erreurNative = erreurDuStatut(statut);
  if (erreurNative !== null) {
    echecLecture(erreurNative, indexDuStatut(statut, indexCourant));
    return;
  }
  if (statut.playing && !statut.isBuffering) relances = 0;
  // Le temps écoulé dans la piste sert aux xassaïdes (barre de temps) et au temps de la sourate (Coran).
  useLecteur.setState({
    enLecture: statut.playing,
    chargement: statut.isBuffering,
    temps: Math.floor(statut.currentTime) || 0,
    ...(enFile?.mode === 'xassaides' ? { duree: Math.floor(statut.duration) || 0 } : {}),
  });
  // iOS ne signale pas l'erreur : un chargement qui n'aboutit pas vaut aussi échec réseau.
  if (statut.playing || !lectureDemandee) {
    clearTimeout(attenteReseau);
    attenteReseau = undefined;
  } else if (statut.isBuffering && attenteReseau === undefined) {
    attenteReseau = setTimeout(() => {
      attenteReseau = undefined;
      echecLecture('Délai de chargement dépassé', indexCourant);
    }, DELAI_RESEAU_MS);
  }
}

// --- Répétition et minuterie ---------------------------------------------------------------------
let ecoutesDuVerset = 1;
/** Saut demandé (suivant, précédent, nouvelle écoute) : ce n'est pas la fin naturelle d'un verset. */
let sautManuel = false;
let minuteur: ReturnType<typeof setTimeout> | undefined;

function appliquerBoucle(): void {
  if (!liste) return;
  const { repeterSourate, minuterie } = useLecteur.getState();
  liste.loop = enFile?.mode === 'sourate' && repeterSourate && minuterie.type !== 'finSourate' ? 'all' : 'none';
}

/** Arrêt par la minuterie : pause, la position reste pour reprendre. */
function finMinuterie(): void {
  clearTimeout(minuteur);
  minuteur = undefined;
  lectureDemandee = false;
  liste?.pause();
  useLecteur.setState({ minuterie: { type: 'aucune' } });
  appliquerBoucle();
}

export function definirMinuterie(m: Minuterie): void {
  clearTimeout(minuteur);
  minuteur = undefined;
  useLecteur.setState({ minuterie: m });
  const reste = resteMinuterie(m, Date.now());
  if (reste !== null) minuteur = setTimeout(finMinuterie, reste);
  appliquerBoucle();
}

export function definirRepetitionVerset(r: RepetitionVerset): void {
  useLecteur.setState({ repetitionVerset: r });
}

export function definirRepeterSourate(actif: boolean): void {
  useLecteur.setState({ repeterSourate: actif });
  appliquerBoucle();
}

function ajouterPistes(pistes: Position[], idRecitateur: string): void {
  // Fichier téléchargé s'il existe, sinon en ligne.
  for (const p of pistes) file().add({ uri: sourceVerset(idRecitateur, p) });
}

function surChangementDePiste({ previousIndex, currentIndex }: { previousIndex: number; currentIndex: number }): void {
  const f = enFile;
  if (!f) return;
  indexCourant = currentIndex;
  if (f.mode === 'xassaides') {
    // Une piste longue par fichier : ni répétition de verset ni page à ajouter.
    const suivante = pisteDeFile(f, currentIndex);
    if (!suivante) return;
    sautManuel = false;
    useLecteur.setState(suivante.etat);
    liste?.updateLockScreenMetadata(suivante.titre);
    return;
  }
  const p = f.pistes[currentIndex];
  if (!p) return;
  const manuel = sautManuel;
  sautManuel = false;
  if (!manuel && currentIndex === previousIndex + 1) {
    // Fin naturelle d'un verset : répétition demandée, puis minuterie « fin de la sourate » en écoute par page.
    if (rejouerVerset(useLecteur.getState().repetitionVerset, ecoutesDuVerset)) {
      ecoutesDuVerset += 1;
      sautManuel = true;
      liste?.skipTo(previousIndex);
      return;
    }
    const avant = f.pistes[previousIndex];
    if (useLecteur.getState().minuterie.type === 'finSourate' && avant && avant.sourate !== p.sourate) {
      finMinuterie();
      return;
    }
  }
  ecoutesDuVerset = 1;
  useLecteur.setState({
    position: p,
    derniere: p,
    page: f.mode === 'page' ? (pageDe(p.sourate, p.verset) ?? null) : null,
    piste: null,
  });
  liste?.updateLockScreenMetadata(metadonnees(p));
  // Mode page : la page suivante entre dans la file avant la fin de la dernière.
  if (f.mode === 'page' && currentIndex >= f.pistes.length - 2 && f.dernierePage < nombreDePages) {
    const suite = pistesDePages(f.dernierePage + 1, f.dernierePage + 1, versetsDePage);
    f.pistes.push(...suite);
    f.dernierePage += 1;
    ajouterPistes(suite, f.recitateur);
  }
}

function file(): AudioPlaylist {
  if (!liste) {
    // Écoute écran éteint ; seule face aux autres sons (exigé pour les commandes de l'écran verrouillé).
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(
      (erreur: unknown) => console.warn('Mode audio non appliqué', erreur),
    );
    liste = createAudioPlaylist({ updateInterval: 500 });
    abonnements = [
      liste.addListener('playlistStatusUpdate', surStatut),
      liste.addListener('trackChanged', surChangementDePiste),
    ];
  }
  return liste;
}

/** Libère la liste native cassée ; la suivante sera créée neuve par `file()`. */
function jeterListe(): void {
  const l = liste;
  liste = undefined;
  listeCassee = false;
  for (const a of abonnements) a.remove();
  abonnements = [];
  if (!l) return;
  try {
    l.clearLockScreenControls();
    l.release();
  } catch (erreur: unknown) {
    console.warn('Liste de lecture non libérée', erreur);
  }
}

/**
 * Remplace la file si besoin, puis lit la piste `index` (à `depuis` secondes pour un xassaïde repris).
 * `relance` : nouvel essai après un échec, sans remettre à zéro le compte des relances.
 */
function lire(nouvelleFile: FileCoran | FileXassaides | null, index: number, depuis = 0, relance = false): void {
  const etat = useLecteur.getState();
  if (!relance) relances = 0;
  // Liste cassée : on repart d'une liste neuve chargée avec la même file.
  let aCharger = nouvelleFile;
  if (listeCassee) {
    jeterListe();
    aCharger ??= enFile;
  }
  const l = file();
  try {
    if (aCharger) {
      l.clear();
      if (aCharger.mode === 'xassaides') {
        // Fichier téléchargé s'il existe, sinon en ligne.
        for (const x of aCharger.pistes) l.add({ uri: sourcePiste(aCharger.source, x) });
      } else ajouterPistes(aCharger.pistes, aCharger.recitateur);
      enFile = aCharger;
    }
    const demandee = enFile ? pisteDeFile(enFile, index) : null;
    if (!demandee) return;
    sautManuel = true;
    ecoutesDuVerset = 1;
    lectureDemandee = true;
    indexCourant = index;
    l.skipTo(index);
    appliquerBoucle();
    l.playbackRate = etat.vitesse;
    useLecteur.setState({ ...demandee.etat, erreur: false, chargement: true });
    l.play();
    if (depuis > 0) l.seekTo(depuis).catch((erreur: unknown) => console.warn('Reprise non placée', erreur));
    l.setActiveForLockScreen(true, demandee.titre);
  } catch (erreur: unknown) {
    console.error('Piste non chargée', erreur);
    useLecteur.setState({ erreur: true, chargement: false, enLecture: false });
  }
}

/** Reprend la piste en cours sur une liste neuve (au même temps pour un xassaïde). */
function relancer(relance = true): void {
  const { piste, temps } = useLecteur.getState();
  lire(null, indexCourant, piste ? temps : 0, relance);
}

/** Lance l'écoute à ce verset (sourate entière à partir de là). */
export function ecouter(p: Position, idRecitateur?: string): void {
  if (!positionValide(p, VERSETS)) return;
  if (idRecitateur && recitateur(idRecitateur)) useLecteur.setState({ recitateur: idRecitateur });
  const r = useLecteur.getState().recitateur;
  const meme = enFile?.mode === 'sourate' && enFile.sourate === p.sourate && enFile.recitateur === r;
  const pistes = Array.from({ length: VERSETS[p.sourate - 1] ?? 0 }, (_, i) => ({ sourate: p.sourate, verset: i + 1 }));
  lire(meme ? null : { mode: 'sourate', sourate: p.sourate, recitateur: r, pistes }, p.verset - 1);
}

/** Écoute page par page depuis le premier verset de `page`, d'une sourate à l'autre, jusqu'à la fin du mushaf. */
export function ecouterPage(page: number): void {
  if (!Number.isInteger(page) || page < 1 || page > nombreDePages) return;
  const fin = Math.min(nombreDePages, page + PAGES_D_AVANCE);
  const r = useLecteur.getState().recitateur;
  lire({ mode: 'page', dernierePage: fin, recitateur: r, pistes: pistesDePages(page, fin, versetsDePage) }, 0);
}

/** Lance l'écoute de ce xassaïde ; les pistes suivantes de la même source s'enchaînent. */
export function ecouterXassaide(idSource: string, idPiste: number): void {
  const s = sourceXassaides(idSource);
  const index = s ? s.pistes.findIndex((x) => x.id === idPiste) : -1;
  if (!s || index < 0) return;
  const meme = enFile?.mode === 'xassaides' && enFile.source === idSource;
  lire(meme ? null : { mode: 'xassaides', source: s.id, nomSource: s.nom, pistes: s.pistes }, index);
}

/** Avance ou recule de `pas` secondes dans la piste en cours (xassaïdes). */
export function sauter(pas: number): void {
  const { piste, duree } = useLecteur.getState();
  if (!liste || !piste || !pisteXassaides(piste.source, piste.id)) return;
  const cible = tempsApresSaut(liste.currentTime, pas, duree);
  useLecteur.setState({ temps: Math.floor(cible) });
  liste.seekTo(cible).catch((erreur: unknown) => console.warn('Saut non appliqué', erreur));
}

/** Place la lecture à `secondes` dans la piste en cours (xassaïdes, barre de temps). */
export function chercher(secondes: number): void {
  const { piste, duree } = useLecteur.getState();
  if (!liste || !piste || !Number.isFinite(secondes)) return;
  const cible = Math.max(0, duree > 0 ? Math.min(secondes, duree) : secondes);
  useLecteur.setState({ temps: Math.floor(cible) });
  liste.seekTo(cible).catch((erreur: unknown) => console.warn('Position non appliquée', erreur));
}

/** Lecture ou pause ; reprend au dernier verset si rien n'est chargé. */
export function basculer(): void {
  const { position, piste, derniere, enLecture, erreur } = useLecteur.getState();
  if (!position && !piste) {
    if (derniere) ecouter(derniere);
    return;
  }
  // Après un échec, « Lecture » repart sur une liste neuve au même endroit.
  if (!enLecture && (listeCassee || erreur)) {
    listeCassee = true;
    relancer(false);
    return;
  }
  const l = file();
  lectureDemandee = !enLecture;
  if (enLecture) l.pause();
  else {
    useLecteur.setState({ erreur: false });
    l.play();
  }
}

export function suivant(): void {
  if (!enEcoute(useLecteur.getState())) return;
  if (listeCassee) return lire(null, indexCourant + 1);
  sautManuel = true;
  liste?.next();
}

export function precedent(): void {
  if (!enEcoute(useLecteur.getState())) return;
  if (listeCassee) return lire(null, Math.max(0, indexCourant - 1));
  sautManuel = true;
  liste?.previous();
}

export function definirVitesse(vitesse: number): void {
  useLecteur.setState({ vitesse });
  if (liste) liste.playbackRate = vitesse;
}

/** Arrête l'écoute et retire les commandes de l'écran verrouillé ; la dernière position reste. */
export function arreter(): void {
  lectureDemandee = false;
  definirMinuterie({ type: 'aucune' });
  liste?.pause();
  liste?.clearLockScreenControls();
  useLecteur.setState({ position: null, page: null, piste: null, enLecture: false, chargement: false });
}
