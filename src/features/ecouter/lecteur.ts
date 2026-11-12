// Lecteur audio unique de l'app : écoute verset par verset, jusqu'à la fin de la sourate ou page par page.
// État partagé par l'onglet Écouter, le lecteur plein écran et le mini-lecteur ; dernière position gardée.
import { createAudioPlaylist, setAudioModeAsync, type AudioPlaylist, type AudioPlaylistStatus } from 'expo-audio';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { nombreDePages, pageDe, sourate, sourates, versetsDePage } from '@/features/lire/coran';
import { stockage } from '@/stores/stockage';

import { versetAuTemps } from './durees';
import { dureesDe } from './dureesDonnees';
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
  /** Temps écoulé dans le verset en cours, en secondes entières. */
  temps: number;
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
      temps: 0,
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
/** Ce qui est en file : la sourate entière, ou des pages du mushaf ajoutées au fur et à mesure. */
let enFile: FileCoran | null = null;
/** Pages ajoutées d'avance en mode page. */
const PAGES_D_AVANCE = 1;

/** Vrai pendant une écoute. */
export const enEcoute = (s: EtatLecteur): boolean => s.position !== null;

function metadonnees(p: Position) {
  const r = recitateur(useLecteur.getState().recitateur);
  return { title: `${sourate(p.sourate)?.nom ?? ''} · ${p.verset}`, artist: r?.nom ?? '' };
}

/** État et titre de l'écran verrouillé pour la piste `index` de la file, ou null si elle n'existe pas. */
function pisteDeFile(f: FileCoran, index: number) {
  const p = f.pistes[index];
  if (!p) return null;
  return {
    etat: {
      position: p,
      derniere: p,
      page: f.mode === 'page' ? (pageDe(p.sourate, p.verset) ?? null) : null,
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
  // Le temps écoulé dans le verset sert au temps de la sourate.
  useLecteur.setState({
    enLecture: statut.playing,
    chargement: statut.isBuffering,
    temps: Math.floor(statut.currentTime) || 0,
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
 * Remplace la file si besoin, puis lit la piste `index` (à `depuis` secondes).
 * `relance` : nouvel essai après un échec, sans remettre à zéro le compte des relances.
 */
function lire(nouvelleFile: FileCoran | null, index: number, depuis = 0, relance = false): void {
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
      ajouterPistes(aCharger.pistes, aCharger.recitateur);
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

/** Reprend le verset en cours sur une liste neuve. */
function relancer(relance = true): void {
  lire(null, indexCourant, 0, relance);
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

/** Place la lecture à `secondes` dans la sourate en cours (écoute par sourate, durées des versets connues). */
export function chercherSourate(secondes: number): void {
  const { position, recitateur: idRecitateur } = useLecteur.getState();
  if (!position || enFile?.mode !== 'sourate') return;
  const cible = versetAuTemps(dureesDe(idRecitateur), VERSETS, position.sourate, secondes);
  if (!cible) return;
  lire(null, cible.verset - 1, cible.dansVerset);
}

/** Lecture ou pause ; reprend au dernier verset si rien n'est chargé. */
export function basculer(): void {
  const { position, derniere, enLecture, erreur } = useLecteur.getState();
  if (!position) {
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
  useLecteur.setState({ position: null, page: null, enLecture: false, chargement: false });
}
