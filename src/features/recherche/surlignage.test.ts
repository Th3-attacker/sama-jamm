/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { surligner } from './surlignage.ts';

test('surligne le mot entier, sans tenir compte des accents ni de la casse', () => {
  const morceaux = surligner("Au nom d'Allah, le Tout Miséricordieux.", 'misericordieux');
  assert.deepEqual(
    morceaux.filter((m) => m.trouve).map((m) => m.texte),
    ['Miséricordieux'],
  );
  assert.equal(morceaux.map((m) => m.texte).join(''), "Au nom d'Allah, le Tout Miséricordieux.");
});

test('plusieurs mots de la requête, plusieurs occurrences', () => {
  const morceaux = surligner('le Tout Miséricordieux, le Très Miséricordieux', 'tres misericordieux');
  assert.equal(morceaux.filter((m) => m.trouve).length, 3);
});

test('requête trop courte, vide ou en arabe : rien de surligné', () => {
  for (const q of ['', 'a', 'الله'])
    assert.equal(surligner('Louange à Allah', q).some((m) => m.trouve), false);
});
