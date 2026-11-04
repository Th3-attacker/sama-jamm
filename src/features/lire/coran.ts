// Texte du Coran embarqué dans l'app, lisible sans réseau.
// Source : édition « quran-uthmani » d'alquran.cloud, reproduite sans modification (vérifié sur la sourate 2 :
// 286 versets identiques ; le texte diffère de celui de Tanzil). Licence de cette édition à confirmer.
// Métadonnées des sourates : donnees/sourates.json, noms français alignés sur ceux de l'app.
// Les gros fichiers (texte, traduction, pages : environ 2,4 Mo) ne sont lus qu'au premier besoin, pas au
// démarrage de l'app : le routeur charge tous les écrans d'un coup.
import donneesSourates from '@/data/sourates.json';

import { creerReperes } from './reperes';

export type Sourate = {
  /** Numéro, de 1 à 114. */
  n: number;
  /** Nom translittéré : « Al-Kahf ». */
  nom: string;
  /** Nom en arabe, affiché à droite de la ligne. */
  arabe: string;
  versets: number;
  /** true : mecquoise, false : médinoise (i18n `lire.mecquoise` / `lire.medinoise`). */
  mecquoise: boolean;
};

export const sourates: readonly Sourate[] = donneesSourates;

const MOTS_BASMALA = 4;
const SANS_BASMALA_EN_TETE = new Set([1, 9]);

let texteEnMemoire: readonly (readonly string[])[] | undefined;
let traductionEnMemoire: readonly (readonly string[])[] | undefined;

/**
 * Index 0 = sourate 1 ; une chaîne de caractères par verset.
 * La source préfixe le verset 1 de chaque sourate (sauf Al-Fâtiha et At-Tawba) de la basmala.
 * L'écran l'affiche à part : on la retire ici (les quatre premiers mots) pour ne pas la répéter.
 * Les fichiers de données restent inchangés.
 */
function texte(): readonly (readonly string[])[] {
  if (!texteEnMemoire) {
    const brut: string[][] = require('@/data/coran/ar.json');
    texteEnMemoire = brut.map((versets, i) =>
      SANS_BASMALA_EN_TETE.has(i + 1) || versets.length === 0
        ? versets
        : [versets[0].split(' ').slice(MOTS_BASMALA).join(' '), ...versets.slice(1)],
    );
  }
  return texteEnMemoire;
}

/** Traduction française (Muhammad Hamidullah, via alquran.cloud), alignée sur `texte()`. */
function traduction(): readonly (readonly string[])[] {
  traductionEnMemoire ??= require('@/data/coran/fr.json');
  return traductionEnMemoire ?? [];
}

/** Sourate inconnue si le numéro n'est pas un entier de 1 à 114. */
export function sourate(n: number): Sourate | undefined {
  return Number.isInteger(n) && n >= 1 && n <= sourates.length ? sourates[n - 1] : undefined;
}

/** Versets d'une sourate, dans l'ordre du mushaf ; tableau vide si la sourate est inconnue. */
export function versetsDe(n: number): readonly string[] {
  const s = sourate(n);
  return s ? (texte()[s.n - 1] ?? []) : [];
}

/** Traduction des versets d'une sourate, dans le même ordre que `versetsDe`. */
export function traductionDe(n: number): readonly string[] {
  const s = sourate(n);
  return s ? (traduction()[s.n - 1] ?? []) : [];
}

// --- Translittération et repères (Tanzil, CC BY 3.0 ; voir scripts/donnees-coran.mjs) ----------

let translitEnMemoire: readonly (readonly string[])[] | undefined;
let reperesEnMemoire: ReturnType<typeof creerReperes> | undefined;

/** Translittération (anglaise, Tanzil) des versets d'une sourate, balises comprises (voir `segmentsTranslit`). */
export function translitDe(n: number): readonly string[] {
  const s = sourate(n);
  if (!s) return [];
  translitEnMemoire ??= require('@/data/coran/translit.json');
  return translitEnMemoire?.[s.n - 1] ?? [];
}

/** Juz, quarts de hizb et prosternations, lus au premier besoin. */
export function reperes(): ReturnType<typeof creerReperes> {
  reperesEnMemoire ??= creerReperes(require('@/data/coran/reperes.json'));
  return reperesEnMemoire;
}

// --- Pages du mushaf (604, disposition Hafs) -------------------------------------------------

/** Nombre de pages du mushaf. */
export const nombreDePages = 604;

type Pages = readonly (readonly (readonly number[])[])[];
let pagesEnMemoire: Pages | undefined;
/** Une référence est `[sourate, verset]`. */
function pages(): Pages {
  pagesEnMemoire ??= require('@/data/coran/pages.json');
  return pagesEnMemoire ?? [];
}

export type VersetPage = { sourate: number; verset: number; texte: string; trad: string };
/** Une page peut enchaîner deux sourates : un segment par suite continue. */
export type SegmentPage = { sourate: number; versets: VersetPage[] };

/** Références d'une page, dans l'ordre de lecture ; tableau vide si la page est inconnue. */
function refsDePage(p: number): readonly (readonly number[])[] {
  return Number.isInteger(p) && p >= 1 && p <= nombreDePages ? (pages()[p - 1] ?? []) : [];
}

/** Page (1 à 604) contenant un verset ; `undefined` si la référence est inconnue. */
export function pageDe(numSourate: number, verset: number): number | undefined {
  return indexPages().get(`${numSourate}:${verset}`);
}

let indexDesPages: Map<string, number> | undefined;
/** Index « sourate:verset » vers page, construit au premier besoin. */
function indexPages(): Map<string, number> {
  if (!indexDesPages) {
    indexDesPages = new Map();
    pages().forEach((refs, i) => refs.forEach(([s, v]) => indexDesPages?.set(`${s}:${v}`, i + 1)));
  }
  return indexDesPages;
}

/** Basmala (arabe et traduction), reprise du premier verset d'Al-Fâtiha ; `undefined` pour Al-Fâtiha et At-Tawba. */
export function basmalaDe(n: number): { arabe: string; trad: string } | undefined {
  if (SANS_BASMALA_EN_TETE.has(n)) return undefined;
  return { arabe: versetsDe(1)[0] ?? '', trad: traductionDe(1)[0] ?? '' };
}

/** Versets d'une sourate avec leur traduction, alignés ; tableau vide si la sourate est inconnue. */
export function versetsAvecTraduction(n: number): { n: number; texte: string; trad: string }[] {
  const trad = traductionDe(n);
  return versetsDe(n).map((v, i) => ({ n: i + 1, texte: v, trad: trad[i] ?? '' }));
}

/** Versets d'une page : texte, traduction et référence, dans l'ordre de lecture. */
export function versetsDePage(p: number): VersetPage[] {
  return refsDePage(p).map(([s, v]) => ({
    sourate: s,
    verset: v,
    texte: versetsDe(s)[v - 1] ?? '',
    trad: traductionDe(s)[v - 1] ?? '',
  }));
}

/** Découpe une page en segments, une sourate continue par segment. */
export function segmentsDePage(p: number): SegmentPage[] {
  const segments: SegmentPage[] = [];
  for (const v of versetsDePage(p)) {
    const dernier = segments[segments.length - 1];
    if (dernier && dernier.sourate === v.sourate) dernier.versets.push(v);
    else segments.push({ sourate: v.sourate, versets: [v] });
  }
  return segments;
}
