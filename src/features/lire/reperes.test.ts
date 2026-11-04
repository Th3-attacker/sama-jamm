/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { creerReperes, segmentsTranslit, type DonneesReperes } from './reperes.ts';

const donnees = JSON.parse(readFileSync('src/data/coran/reperes.json', 'utf8')) as DonneesReperes;
const r = creerReperes(donnees);

test('juz : débuts connus et versets intermédiaires', () => {
  assert.equal(r.juzDe(1, 1), 1);
  assert.equal(r.juzDe(2, 141), 1);
  assert.equal(r.juzDe(2, 142), 2);
  assert.equal(r.juzDe(18, 75), 16);
  assert.equal(r.juzDe(114, 6), 30);
});

test('repères : début de juz prioritaire, puis quarts de hizb', () => {
  assert.deepEqual(r.repereDe(2, 142), { type: 'juz', juz: 2 });
  assert.deepEqual(r.repereDe(2, 26), { type: 'hizb', hizb: 1, quart: 1 });
  assert.deepEqual(r.repereDe(2, 75), { type: 'hizb', hizb: 2, quart: 0 });
  assert.equal(r.repereDe(2, 27), null);
});

test('prosternations : 15, dont la fin d’Al-A’raf et d’Al-‘Alaq', () => {
  assert.equal(donnees.sajdas.length, 15);
  assert.equal(r.sajdaDe(7, 206), 'recommandee');
  assert.equal(r.sajdaDe(96, 19), 'obligatoire');
  assert.equal(r.sajdaDe(1, 1), null);
});

test('translittération : balises de Tanzil en segments, texte intact', () => {
  const brut = 'Bismi All<u>a</U>hi a<b>l</B>rra<u>h</U>m<u>a</U>ni';
  const s = segmentsTranslit(brut);
  assert.equal(s.map((x) => x.texte).join(''), 'Bismi Allahi alrrahmani');
  assert.deepEqual(s.slice(0, 3), [
    { texte: 'Bismi All', style: 'normal' },
    { texte: 'a', style: 'long' },
    { texte: 'hi a', style: 'normal' },
  ]);
  assert.equal(s[3]?.style, 'muet');
});
