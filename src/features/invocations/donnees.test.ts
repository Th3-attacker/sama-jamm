import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CATEGORIES_IDS, estCategorie, type Categorie, type Invocation } from './donnees.ts';

const { categories, duas }: { categories: Categorie[]; duas: Invocation[] } = JSON.parse(
  readFileSync(new URL('../../data/invocations/duas.json', import.meta.url), 'utf8'),
);

test('5 catégories, 83 invocations (24, 24, 8, 15, 12), identifiants uniques', () => {
  assert.equal(categories.length, 5);
  assert.equal(duas.length, 83);
  const nb = (id: string) => duas.filter((d) => d.categorie === id).length;
  assert.deepEqual(
    ['morning', 'evening', 'after_prayer', 'sleep', 'travel'].map(nb),
    [24, 24, 8, 15, 12],
  );
  assert.equal(new Set(duas.map((d) => d.id)).size, duas.length);
  assert.equal(new Set(categories.map((c) => c.id)).size, categories.length);
});

test('chaque invocation a une catégorie connue, un titre, de l’arabe, une source et des répétitions valides', () => {
  const ids = new Set(categories.map((c) => c.id));
  for (const d of duas) {
    assert.ok(ids.has(d.categorie), `catégorie inconnue : ${d.id}`);
    assert.ok(d.titre.trim() !== '' && d.arabe.trim() !== '' && d.source.trim() !== '', `champ vide : ${d.id}`);
    assert.ok(/[؀-ۿ]/.test(d.arabe), `pas d’arabe : ${d.id}`);
    assert.ok(Number.isInteger(d.repetitions) && d.repetitions >= 1, `répétitions invalides : ${d.id}`);
  }
  for (const c of categories) assert.ok(duas.some((d) => d.categorie === c.id), `catégorie vide : ${c.id}`);
});

test('le texte sacré s’affiche en arabe seul : aucun sens ni translittération inventés', () => {
  for (const d of duas) {
    assert.equal(d.sens, null, `sens présent : ${d.id}`);
    assert.equal(d.translit, '', `translittération présente : ${d.id}`);
    assert.match(d.source, /^Hisn al-Muslim · \d+\.\d+$/, `source inattendue : ${d.id}`);
  }
});

test('la liste des catégories du code suit celle des données, dans le même ordre', () => {
  assert.deepEqual([...CATEGORIES_IDS], categories.map((c) => c.id));
  assert.equal(estCategorie('morning'), true);
  assert.equal(estCategorie('hisn'), false);
});
