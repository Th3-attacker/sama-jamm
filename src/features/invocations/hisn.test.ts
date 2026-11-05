import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { debutDe, titreDe, type ChapitreHisn } from './hisn.ts';

const brut = JSON.parse(readFileSync(new URL('../../data/invocations/hisn.json', import.meta.url), 'utf8'));
const chapitres: ChapitreHisn[] = brut.chapitres;

test('132 chapitres numérotés de 1 à 132, tous avec un titre et au moins une invocation', () => {
  assert.equal(chapitres.length, 132);
  chapitres.forEach((c, i) => {
    assert.equal(c.id, i + 1);
    assert.ok(c.titreAr.length > 0 && c.titreFr.length > 0, `titre manquant (${c.id})`);
    assert.ok(c.items.length > 0, `chapitre vide (${c.id})`);
  });
});

test('chaque invocation a un texte et un nombre de lectures entier supérieur à zéro', () => {
  for (const c of chapitres)
    for (const it of c.items) {
      assert.ok(it.texte.trim().length > 0, `texte vide (${c.id}:${it.id})`);
      assert.ok(Number.isInteger(it.repetitions) && it.repetitions >= 1, `lectures invalides (${c.id}:${it.id})`);
    }
});

test('la source et la licence déclarée sont notées dans le fichier', () => {
  assert.ok(brut.meta.ouvrage.includes('Hisn al-Muslim'));
  assert.ok(brut.meta.texteArabe.includes('rn0x'));
});

test('titreDe suit la langue ; debutDe garde les premiers mots', () => {
  const c = { titreAr: 'أذكار النوم', titreFr: 'Invocations avant de dormir' };
  assert.equal(titreDe(c, 'ar'), c.titreAr);
  assert.equal(titreDe(c, 'fr'), c.titreFr);
  assert.equal(titreDe(c, 'wo'), c.titreFr);
  assert.equal(debutDe('((بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ))'), 'بِسْمِ اللَّهِ الَّذِي');
});
