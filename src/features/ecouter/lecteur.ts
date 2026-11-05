// Lecteur audio unique de l'app : écoute verset par verset, jusqu'à la fin de la sourate ou page par page.
// État partagé par l'onglet Écouter, le lecteur plein écran et le mini-lecteur ; dernière position gardée.
import { createAudioPlaylist, setAudioModeAsync, type AudioPlaylist, type AudioPlaylistStatus } from 'expo-audio';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { nombreDePages, pageDe, sourate, sourates, versetsDePage } from '@/features/lire/coran';
import { stockage } from '@/stores/stockage';

import { rejouerVerset, resteMinuterie, type Minuterie, type RepetitionVerset } from './minuterie';
import { positionValide, recitateur, RECITATEURS, pistesDePages, type Position } from './recitateurs';
import { sourceVerset } from './telechargements';

const VERSETS = sourates.map((s) => s.versets);
export const VITESSES = [0.75, 1, 1.25, 1.5] as const;

type EtatLecteur = {
  /** Verset en cours d'écoute, ou null si rien n'est chargé. */
  position: Position | null;
  /** Dernier verset écouté, pour « Reprendre » (gardé sur le téléphone). */
  derniere: Position | null;
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
/** Ce qui est en file : la sourate entière, ou des pages du mushaf ajoutées au fur et à mesure. */
let enFile:
  | { mode: 'sourate'; sourate: number; recitateur: string; pistes: Position[] }
  | { mode: 'page'; dernierePage: number; recitateur: string; pistes: Position[] }
  | null = null;
/** Pages ajoutées d'avance en mode page. */
const PAGES_D_AVANCE = 1;

function metadonnees(p: Position) {
  const r = recitateur(useLecteur.getState().recitateur);
  return { title: `${sourate(p.sourate)?.nom ?? ''} · ${p.verset}`, artist: r?.nom ?? '' };
}

/** Délai de chargement au-delà duquel le verset est considéré comme injoignable (hors ligne). */
const DELAI_RESEAU_MS = 15_000;
let attenteReseau: ReturnType<typeof setTimeout> | undefined;
let lectureDemandee = false;

function surStatut(statut: AudioPlaylistStatus): void {
  useLecteur.setState({ enLecture: statut.playing, chargement: statut.isBuffering });
  // Pas d'événement d'erreur dans la liste de lecture : un chargement qui n'aboutit pas vaut échec réseau.
  if (statut.playing || !lectureDemandee) {
    clearTimeout(attenteReseau);
    attenteReseau = undefined;
  } else if (statut.isBuffering && attenteReseau === undefined) {
    attenteReseau = setTimeout(() => {
      attenteReseau = undefined;
      lectureDemandee = false;
      liste?.pause();
      useLecteur.setState({ erreur: true, enLecture: false, chargement: false });
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
  const p = f?.pistes[currentIndex];
  if (!f || !p) return;
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
    liste.addListener('playlistStatusUpdate', surStatut);
    liste.addListener('trackChanged', surChangementDePiste);
  }
  return liste;
}

/** Remplace la file si besoin, puis lit la piste `index`. */
function lire(nouvelleFile: NonNullable<typeof enFile> | null, index: number): void {
  const etat = useLecteur.getState();
  const l = file();
  try {
    if (nouvelleFile) {
      l.clear();
      ajouterPistes(nouvelleFile.pistes, nouvelleFile.recitateur);
      enFile = nouvelleFile;
    }
    const p = enFile?.pistes[index];
    if (!p) return;
    sautManuel = true;
    ecoutesDuVerset = 1;
    lectureDemandee = true;
    l.skipTo(index);
    appliquerBoucle();
    l.playbackRate = etat.vitesse;
    useLecteur.setState({
      position: p,
      derniere: p,
      page: enFile?.mode === 'page' ? (pageDe(p.sourate, p.verset) ?? null) : null,
      erreur: false,
      chargement: true,
    });
    l.play();
    l.setActiveForLockScreen(true, metadonnees(p));
  } catch (erreur: unknown) {
    console.error('Verset non chargé', erreur);
    useLecteur.setState({ erreur: true, chargement: false, enLecture: false });
  }
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

/** Lecture ou pause ; reprend au dernier verset si rien n'est chargé. */
export function basculer(): void {
  const { position, derniere, enLecture } = useLecteur.getState();
  if (!position) {
    if (derniere) ecouter(derniere);
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
  if (!useLecteur.getState().position) return;
  sautManuel = true;
  liste?.next();
}

export function precedent(): void {
  if (!useLecteur.getState().position) return;
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
