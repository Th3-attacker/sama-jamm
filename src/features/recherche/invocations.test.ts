import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chercherInvocations, type InvocationCherchable } from './invocations.ts';

const liste: InvocationCherchable[] = [
  { id: 'a', categorie: 'morning', titre: 'Se réfugier auprès d’Allah', arabe: 'أَعُوذُ بِاللَّهِ', translit: 'A<b>ʿ</b>udhu billahi', sens: 'Je cherche refuge' },
  { id: 'b', categorie: 'evening', titre: 'Le pardon', arabe: 'رَبِّ اغْفِرْ لِي', translit: 'Rabbi ghfir li', sens: null },
];

test('trouve par le titre, sans accents', () => {
  assert.deepEqual(chercherInvocations(liste, 'refugier').map((i) => i.id), ['a']);
});

test('trouve par la translittération et par le sens', () => {
  assert.deepEqual(chercherInvocations(liste, 'rabbi').map((i) => i.id), ['b']);
  assert.deepEqual(chercherInvocations(liste, 'cherche refuge').map((i) => i.id), ['a']);
});

test('trouve en arabe, sans voyelles', () => {
  assert.deepEqual(chercherInvocations(liste, 'اغفر لي').map((i) => i.id), ['b']);
});

test('requête trop courte : rien', () => {
  assert.deepEqual(chercherInvocations(liste, 'a'), []);
});
