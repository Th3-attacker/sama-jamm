import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CATEGORIES_IDS, debutDe, estCategorie, type Categorie, type Invocation } from './donnees.ts';

const { categories, duas }: { categories: Categorie[]; duas: Invocation[] } = JSON.parse(
  readFileSync(new URL('../../data/invocations/duas.json', import.meta.url), 'utf8'),
);

// Textes qui sont des versets du Coran : arabe seul, sans traduction (AGENTS.md, contenu sacré).
const CORANIQUES = ['d13', 'd19', 'd47', 'd59', 'd61', 'd92', 'd102', 'd124', 'd125'];

test('16 catégories, 78 invocations, identifiants uniques', () => {
  assert.equal(categories.length, 16);
  assert.equal(duas.length, 78);
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

test('le Coran n’a pas de traduction : sens absent pour les textes coraniques, présent pour les autres', () => {
  for (const d of duas) {
    if (CORANIQUES.includes(d.id)) assert.equal(d.sens, null, `traduction du Coran : ${d.id}`);
    else assert.ok(d.sens && d.sens.trim() !== '', `sens manquant : ${d.id}`);
  }
});

test('debutDe garde les premiers mots sans parenthèses', () => {
  assert.equal(debutDe('(بِسْمِ اللَّهِ) الرَّحْمَٰنِ الرَّحِيمِ ثم', 3), 'بِسْمِ اللَّهِ الرَّحْمَٰنِ');
});

test('la liste des catégories du code suit celle des données, dans le même ordre', () => {
  assert.deepEqual([...CATEGORIES_IDS], categories.map((c) => c.id));
  assert.equal(estCategorie('morning'), true);
  assert.equal(estCategorie('hisn'), false);
});
