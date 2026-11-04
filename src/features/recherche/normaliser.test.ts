/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contientArabe, normaliserArabe, normaliserLatin } from './normaliser.ts';

test('arabe : voyelles et signes de récitation retirés', () => {
  assert.equal(normaliserArabe('بِسْمِ ٱللَّهِ'), 'بسم الله');
});

test('arabe : alifs unifiés, ة → ه, ى → ي', () => {
  assert.equal(normaliserArabe('أ إ آ ٱ'), 'ا ا ا ا');
  assert.equal(normaliserArabe('رحمة'), 'رحمه');
  assert.equal(normaliserArabe('موسى'), 'موسي');
});

test('arabe : tatwil retiré, espaces réduits', () => {
  assert.equal(normaliserArabe('  الـــله   اكبر '), 'الله اكبر');
});

test('latin : sans accents ni casse, en français et en wolof', () => {
  assert.equal(normaliserLatin('Éternel Miséricordieux'), 'eternel misericordieux');
  assert.equal(normaliserLatin('Jàmm ak Ñaata'), 'jamm ak naata');
  assert.equal(normaliserLatin('Sëriñ'), 'serin');
});

test('latin : ponctuation et tirets deviennent des espaces', () => {
  assert.equal(normaliserLatin('Yâ-Sîn'), 'ya sin');
  assert.equal(normaliserLatin("L'Aube, (89)"), 'l aube 89');
});

test('détection de l’arabe', () => {
  assert.equal(contientArabe('الكهف'), true);
  assert.equal(contientArabe('kahf 18'), false);
  assert.equal(contientArabe('Al-Kahf الكهف'), true);
});
