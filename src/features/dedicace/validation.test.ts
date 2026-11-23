/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { controlerNom, normaliserNom, NOM_MAX } from './validation.ts';

test('espaces normalisés', () => {
  assert.equal(normaliserNom('  Mamadou   Diallo '), 'Mamadou Diallo');
});

test('nom complet accepté, avec apostrophe, trait d’union, accents et arabe', () => {
  assert.deepEqual(controlerNom('Mamadou Diallo'), { valide: true, nom: 'Mamadou Diallo' });
  assert.deepEqual(controlerNom('Aïssatou N’Diaye-Sow'), { valide: true, nom: 'Aïssatou N’Diaye-Sow' });
  assert.deepEqual(controlerNom('Aïssatou N\'Diaye'), { valide: true, nom: 'Aïssatou N\'Diaye' });
  assert.deepEqual(controlerNom('محمد الفاسي'), { valide: true, nom: 'محمد الفاسي' });
});

test('trop court ou trop long, mesuré en caractères', () => {
  assert.deepEqual(controlerNom(' a '), { valide: false, raison: 'trop-court' });
  assert.deepEqual(controlerNom(''), { valide: false, raison: 'trop-court' });
  assert.equal(controlerNom('a'.repeat(NOM_MAX)).valide, true);
  assert.deepEqual(controlerNom('a'.repeat(NOM_MAX + 1)), { valide: false, raison: 'trop-long' });
});

test('chiffres, balises, adresses et symboles refusés', () => {
  for (const mauvais of ['Nom 12', '<b>x</b>', 'a@b', 'a/b', 'a:b', 'a_b', 'a=b', 'a(b)', 'a#b']) {
    assert.deepEqual(controlerNom(mauvais), { valide: false, raison: 'caracteres' }, mauvais);
  }
});

test('liens refusés', () => {
  assert.deepEqual(controlerNom('Voir www.exemple'), { valide: false, raison: 'lien' });
  assert.deepEqual(controlerNom('httpfoo bar'), { valide: false, raison: 'lien' });
});
