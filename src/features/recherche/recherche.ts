// Recherche dans le Coran embarqué, sans réseau : arabe, traduction française et noms de sourates.
// L'index (textes normalisés) est préparé par paquets à l'ouverture de l'écran (`preparerIndex`), sans figer la saisie ;
// à défaut, il est construit d'un bloc à la première recherche.
import { sourate, sourates, traductionDe, versetsDe, type Sourate } from '@/features/lire/coran';

import { parPaquets } from '@/lib/paquets';

import { contientArabe, normaliserArabe, normaliserLatin } from './normaliser';

export type ResultatVerset = { sourate: number; verset: number; texte: string; trad: string };
export type Resultats = {
  sourates: Sourate[];
  versets: ResultatVerset[];
  /** Nombre total de versets trouvés, même si la liste est coupée à `LIMITE_VERSETS`. */
  totalVersets: number;
};

export const LIMITE_VERSETS = 100;
const LIMITE_SOURATES = 10;
const LONGUEUR_MINI = 2;

type Index = {
  noms: { sourate: Sourate; nom: string; sansEspaces: string; arabe: string }[];
  arabe: string[][];
  trad: string[][];
};
let indexEnMemoire: Index | undefined;
let preparation: Promise<void> | undefined;

const nomNormalise = (s: Sourate) => {
  const nom = normaliserLatin(s.nom);
  return { sourate: s, nom, sansEspaces: nom.replace(/ /g, ''), arabe: normaliserArabe(s.arabe) };
};
/** Une sourate de l'index : ses versets normalisés en arabe et en français. */
const sourateNormalisee = (i: number) => {
  const n = sourates[i]?.n ?? i + 1;
  return { arabe: versetsDe(n).map(normaliserArabe), trad: traductionDe(n).map(normaliserLatin) };
};

function index(): Index {
  if (!indexEnMemoire) {
    const parSourate = sourates.map((_, i) => sourateNormalisee(i));
    indexEnMemoire = {
      noms: sourates.map(nomNormalise),
      arabe: parSourate.map((x) => x.arabe),
      trad: parSourate.map((x) => x.trad),
    };
  }
  return indexEnMemoire;
}

/** Vrai quand l'index est prêt : une recherche ne bloquera plus l'écran. */
export function indexPret(): boolean {
  return indexEnMemoire !== undefined;
}

/** Prépare l'index par paquets de 10 sourates, en cédant la main entre deux paquets. Une seule préparation à la fois. */
export function preparerIndex(): Promise<void> {
  if (indexEnMemoire) return Promise.resolve();
  preparation ??= parPaquets(sourates.length, sourateNormalisee, 10)
    .then((parSourate) => {
      indexEnMemoire ??= {
        noms: sourates.map(nomNormalise),
        arabe: parSourate.map((x) => x.arabe),
        trad: parSourate.map((x) => x.trad),
      };
    })
    .finally(() => {
      preparation = undefined;
    });
  return preparation;
}

/** Tous les mots de la requête doivent se trouver dans le texte. */
const contientTout = (texte: string, mots: string[]) => mots.every((m) => texte.includes(m));

export const VIDE: Resultats = { sourates: [], versets: [], totalVersets: 0 };

export function rechercher(requete: string): Resultats {
  const arabe = contientArabe(requete);
  const norm = arabe ? normaliserArabe(requete) : normaliserLatin(requete);
  if (norm.replace(/ /g, '').length < LONGUEUR_MINI) return VIDE;
  const mots = norm.split(' ');
  const idx = index();

  // Noms de sourates : « kahf » trouve Al-Kahf, « yasin » trouve Yâ-Sîn.
  const souratesTrouvees = idx.noms
    .filter((n) =>
      arabe ? contientTout(n.arabe, mots) : n.nom.includes(norm) || n.sansEspaces.includes(norm.replace(/ /g, '')),
    )
    .slice(0, LIMITE_SOURATES)
    .map((n) => n.sourate);

  const source = arabe ? idx.arabe : idx.trad;
  const versets: ResultatVerset[] = [];
  let total = 0;
  source.forEach((liste, i) => {
    liste.forEach((texte, j) => {
      if (!contientTout(texte, mots)) return;
      total += 1;
      if (versets.length >= LIMITE_VERSETS) return;
      const n = i + 1;
      versets.push({ sourate: n, verset: j + 1, texte: versetsDe(n)[j] ?? '', trad: traductionDe(n)[j] ?? '' });
    });
  });

  return { sourates: souratesTrouvees, versets, totalVersets: total };
}

/** Nom de la sourate d'un résultat, pour l'en-tête « Al-Kahf · 18:46 ». */
export function referenceVerset(n: number, verset: number): string {
  return `${sourate(n)?.nom ?? ''} · ${n}:${verset}`;
}
