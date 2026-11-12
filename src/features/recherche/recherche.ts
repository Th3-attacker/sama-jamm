// Recherche dans le Coran embarqué, sans réseau : arabe, translittération et noms de sourates (aucune traduction).
// L'index (textes normalisés) est préparé par paquets à l'ouverture de l'écran (`preparerIndex`), sans figer la saisie ;
// à défaut, il est construit d'un bloc à la première recherche. La correspondance elle-même vit dans `moteur.ts`.
import { sourate, sourates, translitDe, versetsDe } from '@/features/lire/coran';

import { parPaquets } from '@/lib/paquets';

import { chercher, nomNormalise, versetsNormalises, type Index, type Resultats } from './moteur';

export { LIMITE_VERSETS, VIDE, type ResultatVerset, type Resultats } from './moteur';

let indexEnMemoire: Index | undefined;
let preparation: Promise<void> | undefined;

/** Une sourate de l'index : ses versets normalisés en arabe et en translittération. */
const sourateNormalisee = (i: number) => {
  const n = sourates[i]?.n ?? i + 1;
  return versetsNormalises(versetsDe(n), translitDe(n));
};

function index(): Index {
  if (!indexEnMemoire) {
    const parSourate = sourates.map((_, i) => sourateNormalisee(i));
    indexEnMemoire = {
      noms: sourates.map(nomNormalise),
      arabe: parSourate.map((x) => x.arabe),
      translit: parSourate.map((x) => x.translit),
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
        translit: parSourate.map((x) => x.translit),
      };
    })
    .finally(() => {
      preparation = undefined;
    });
  return preparation;
}

export function rechercher(requete: string): Resultats {
  return chercher(index(), requete, { versetsDe, translitDe });
}

/** Nom de la sourate d'un résultat, pour l'en-tête « Al-Kahf · 18:46 ». */
export function referenceVerset(n: number, verset: number): string {
  return `${sourate(n)?.nom ?? ''} · ${n}:${verset}`;
}
