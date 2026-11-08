import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CATEGORIES_HISN, chapitresDeCategorie, estCategorieHisn, idsDeCategorie } from './categoriesHisn.ts';
import type { ChapitreHisn } from './hisn.ts';

const brut = JSON.parse(readFileSync(new URL('../../data/invocations/hisn.json', import.meta.url), 'utf8'));
const chapitres: ChapitreHisn[] = brut.chapitres;

test('les 132 chapitres sont classés une seule fois, sans trou ni doublon', () => {
  const vus = new Map<number, string>();
  for (const cat of CATEGORIES_HISN)
    for (const id of idsDeCategorie(cat)) {
      assert.ok(!vus.has(id), `chapitre ${id} dans ${vus.get(id)} et ${cat}`);
      vus.set(id, cat);
    }
  assert.equal(vus.size, chapitres.length);
  for (const c of chapitres) assert.ok(vus.has(c.id), `chapitre ${c.id} non classé`);
});

test('aucune catégorie vide, et les chapitres sortent dans l’ordre de l’ouvrage', () => {
  for (const cat of CATEGORIES_HISN) {
    const liste = chapitresDeCategorie(cat, chapitres);
    assert.ok(liste.length > 0, `catégorie vide : ${cat}`);
    assert.deepEqual(
      liste.map((c) => c.id),
      [...idsDeCategorie(cat)].sort((a, b) => a - b),
    );
  }
});

test('estCategorieHisn reconnaît les identifiants valides seulement', () => {
  assert.ok(estCategorieHisn('voyage'));
  assert.ok(!estCategorieHisn('inconnue'));
});
