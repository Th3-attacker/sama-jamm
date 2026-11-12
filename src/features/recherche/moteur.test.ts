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
const TRANSLIT = [
  ['Bis<u>mi</u> <b>a</b>llahi <u>a</u>rrahmani arrahimi', 'Alhamdu lillahi'],
  ['Ashabi alkahfi', 'Rahmatan'],
  ['Ya-Sin'],
];
const textes: Textes = {
  versetsDe: (n) => ARABE[n - 1] ?? [],
  translitDe: (n) => TRANSLIT[n - 1] ?? [],
};

function indexDe(arabe: string[][], translit: string[][], sourates = SOURATES): Index {
  const parSourate = arabe.map((a, i) => versetsNormalises(a, translit[i] ?? []));
  return {
    noms: sourates.map(nomNormalise),
    arabe: parSourate.map((x) => x.arabe),
    translit: parSourate.map((x) => x.translit),
  };
}
const IDX = indexDe(ARABE, TRANSLIT);

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

test('translittération : sans balises ni accents, tous les mots doivent être présents', () => {
  const r = chercher(IDX, 'bismi allahi', textes);
  assert.equal(r.totalVersets, 1);
  assert.deepEqual(r.versets[0], {
    sourate: 1,
    verset: 1,
    texte: ARABE[0]![0],
    translit: 'Bismi allahi arrahmani arrahimi',
  });
  assert.equal(chercher(IDX, 'rahm', textes).totalVersets, 2);
  assert.equal(chercher(IDX, 'alhamdu kahfi', textes).totalVersets, 0);
});

test('aucune traduction : un mot français ne trouve rien', () => {
  assert.equal(chercher(IDX, 'miséricordieux', textes).totalVersets, 0);
  assert.equal(chercher(IDX, 'louange', textes).totalVersets, 0);
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
  const translit = [Array.from({ length: nombre }, () => 'nur')];
  const r = chercher(indexDe(arabe, translit, SOURATES.slice(0, 1)), 'nur', {
    versetsDe: () => arabe[0] ?? [],
    translitDe: () => translit[0] ?? [],
  });
  assert.equal(r.versets.length, LIMITE_VERSETS);
  assert.equal(r.totalVersets, nombre);
  assert.equal(r.versets.at(-1)?.verset, LIMITE_VERSETS);
});
