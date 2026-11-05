/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  numeroGlobal,
  pistesDePages,
  positionDeNumero,
  positionValide,
  urlVerset,
  versetPrecedent,
  versetSuivant,
} from './recitateurs.ts';

const versets = (JSON.parse(readFileSync('src/data/sourates.json', 'utf8')) as { versets: number }[]).map(
  (s) => s.versets,
);

test('numéro global : début, Al-Baqara, dernier verset', () => {
  assert.equal(numeroGlobal({ sourate: 1, verset: 1 }, versets), 1);
  assert.equal(numeroGlobal({ sourate: 2, verset: 255 }, versets), 262);
  assert.equal(numeroGlobal({ sourate: 114, verset: 6 }, versets), 6236);
});

test('adresse du fichier d’un verset', () => {
  assert.equal(
    urlVerset('ar.alafasy', { sourate: 2, verset: 255 }, versets),
    'https://cdn.islamic.network/quran/audio/64/ar.alafasy/262.mp3',
  );
});

test('versets suivant et précédent, arrêt en fin de sourate', () => {
  assert.deepEqual(versetSuivant({ sourate: 1, verset: 6 }, versets), { sourate: 1, verset: 7 });
  assert.equal(versetSuivant({ sourate: 1, verset: 7 }, versets), null);
  assert.deepEqual(versetPrecedent({ sourate: 2, verset: 1 }), { sourate: 2, verset: 1 });
});

test('position valable', () => {
  assert.ok(positionValide({ sourate: 114, verset: 6 }, versets));
  assert.ok(!positionValide({ sourate: 1, verset: 8 }, versets));
  assert.ok(!positionValide({ sourate: 115, verset: 1 }, versets));
});

test('versets d’une suite de pages, à cheval sur deux sourates', () => {
  const pages: Record<number, { sourate: number; verset: number }[]> = {
    1: [{ sourate: 1, verset: 7 }],
    2: [
      { sourate: 2, verset: 1 },
      { sourate: 2, verset: 2 },
    ],
  };
  assert.deepEqual(
    pistesDePages(1, 2, (p) => pages[p] ?? []),
    [
      { sourate: 1, verset: 7 },
      { sourate: 2, verset: 1 },
      { sourate: 2, verset: 2 },
    ],
  );
  assert.deepEqual(
    pistesDePages(3, 3, (p) => pages[p] ?? []),
    [],
  );
});

test('numéro global vers sourate et verset', () => {
  assert.deepEqual(positionDeNumero(262, versets), { sourate: 2, verset: 255 });
  assert.deepEqual(positionDeNumero(6236, versets), { sourate: 114, verset: 6 });
  assert.equal(positionDeNumero(6237, versets), null);
  assert.equal(positionDeNumero(0, versets), null);
});
