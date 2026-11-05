// Lecteur audio unique de l'app : écoute verset par verset, jusqu'à la fin de la sourate ou page par page.
// État partagé par l'onglet Écouter, le lecteur plein écran et le mini-lecteur ; dernière position gardée.
import { createAudioPlaylist, setAudioModeAsync, type AudioPlaylist, type AudioPlaylistStatus } from 'expo-audio';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { nombreDePages, pageDe, sourate, sourates, versetsDePage } from '@/features/lire/coran';
import { stockage } from '@/stores/stockage';

import { positionValide, recitateur, RECITATEURS, pistesDePages, urlVerset, type Position } from './recitateurs';

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
    }),
    {
      name: 'lecteur',
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ derniere, recitateur: r, vitesse }) => ({ derniere, recitateur: r, vitesse }),
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

function surStatut(statut: AudioPlaylistStatus): void {
  useLecteur.setState({ enLecture: statut.playing, chargement: statut.isBuffering });
}

function ajouterPistes(pistes: Position[], idRecitateur: string): void {
  for (const p of pistes) file().add({ uri: urlVerset(idRecitateur, p, VERSETS) });
}

function surChangementDePiste({ currentIndex }: { currentIndex: number }): void {
  const f = enFile;
  const p = f?.pistes[currentIndex];
  if (!f || !p) return;
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
    l.skipTo(index);
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
  if (enLecture) l.pause();
  else l.play();
}

export function suivant(): void {
  if (useLecteur.getState().position) liste?.next();
}

export function precedent(): void {
  if (useLecteur.getState().position) liste?.previous();
}

export function definirVitesse(vitesse: number): void {
  useLecteur.setState({ vitesse });
  if (liste) liste.playbackRate = vitesse;
}

/** Arrête l'écoute et retire les commandes de l'écran verrouillé ; la dernière position reste. */
export function arreter(): void {
  liste?.pause();
  liste?.clearLockScreenControls();
  useLecteur.setState({ position: null, page: null, enLecture: false, chargement: false });
}
