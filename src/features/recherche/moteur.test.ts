/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Sourate } from '@/features/lire/coran';

import { chercher, LIMITE_VERSETS, nomNormalise, versetsNormalises, VIDE, type Index, type Textes } from './moteur.ts';

// Mini-Coran de test : trois sourates.
const SOURATES: Sourate[] = [
  { n: 1, nom: 'Al-Fatiha', arabe: 'الفاتحة', versets: 2, mecquoise: true },
  { n: 2, nom: 'Al-Kahf', arabe: 'الكهف', versets: 2, mecquoise: true },
  { n: 3, nom: 'Yâ-Sîn', arabe: 'يس', versets: 1, mecquoise: true },
];
const ARABE = [
  ['بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', 'ٱلْحَمْدُ لِلَّهِ'],
  ['أَصْحَٰبَ ٱلْكَهْفِ', 'رَحْمَةً'],
  ['يسٓ'],
];
const TRAD = [
  ['Au nom d’Allah, le Tout Miséricordieux', 'Louange à Allah'],
  ['Les gens de la Caverne', 'Une miséricorde de Ta part'],
  ['Yâ-Sîn'],
];
const textes: Textes = {
  versetsDe: (n) => ARABE[n - 1] ?? [],
  traductionDe: (n) => TRAD[n - 1] ?? [],
};

function indexDe(arabe: string[][], trad: string[][], sourates = SOURATES): Index {
  const parSourate = arabe.map((a, i) => versetsNormalises(a, trad[i] ?? []));
  return {
    noms: sourates.map(nomNormalise),
    arabe: parSourate.map((x) => x.arabe),
    trad: parSourate.map((x) => x.trad),
  };
}
const IDX = indexDe(ARABE, TRAD);

test('requête trop courte : aucun résultat', () => {
  assert.equal(chercher(IDX, 'a', textes), VIDE);
  assert.equal(chercher(IDX, '  ', textes), VIDE);
});

test('noms de sourates : « kahf » trouve Al-Kahf, « yasin » trouve Yâ-Sîn', () => {
  assert.deepEqual(
    chercher(IDX, 'kahf', textes).sourates.map((s) => s.n),
    [2],
  );
  assert.deepEqual(
    chercher(IDX, 'yasin', textes).sourates.map((s) => s.n),
    [3],
  );
});

test('français : sans accents, tous les mots doivent être présents', () => {
  const r = chercher(IDX, 'misericordieux allah', textes);
  assert.equal(r.totalVersets, 1);
  assert.deepEqual(r.versets[0], { sourate: 1, verset: 1, texte: ARABE[0]![0], trad: TRAD[0]![0] });
  assert.equal(chercher(IDX, 'misericord', textes).totalVersets, 2);
  assert.equal(chercher(IDX, 'louange caverne', textes).totalVersets, 0);
});

test('arabe : sans voyelles, ة et alifs unifiés', () => {
  const r = chercher(IDX, 'رحمه', textes);
  assert.deepEqual(
    r.versets.map((v) => `${v.sourate}:${v.verset}`),
    ['2:2'],
  );
  assert.deepEqual(
    chercher(IDX, 'الكهف', textes).sourates.map((s) => s.n),
    [2],
  );
});

test('liste coupée à LIMITE_VERSETS, mais le total compte tous les versets', () => {
  const nombre = LIMITE_VERSETS + 20;
  const arabe = [Array.from({ length: nombre }, () => 'نور')];
  const trad = [Array.from({ length: nombre }, () => 'lumière')];
  const r = chercher(indexDe(arabe, trad, SOURATES.slice(0, 1)), 'lumiere', {
    versetsDe: () => arabe[0] ?? [],
    traductionDe: () => trad[0] ?? [],
  });
  assert.equal(r.versets.length, LIMITE_VERSETS);
  assert.equal(r.totalVersets, nombre);
  assert.equal(r.versets.at(-1)?.verset, LIMITE_VERSETS);
});
