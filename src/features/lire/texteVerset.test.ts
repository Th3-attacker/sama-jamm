/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lienVerset, texteACopier, texteInvocationACopier } from './texteVerset.ts';

const verset = { sourate: 13, nomSourate: 'Ar-Raʿd', n: 28, texte: 'ٱلَّذِينَ ءَامَنُوا۟', translit: 'alladhina amanu' };

test('le texte copié : arabe, référence et lien, sans translittération par défaut', () => {
  assert.equal(texteACopier(verset, false), 'ٱلَّذِينَ ءَامَنُوا۟\n\nAr-Raʿd · 13:28\n\nhttps://quran.com/13/28');
});

test('la translittération n\'est ajoutée que si elle est demandée et disponible', () => {
  assert.equal(texteACopier(verset, true), 'ٱلَّذِينَ ءَامَنُوا۟\n\nalladhina amanu\n\nAr-Raʿd · 13:28\n\nhttps://quran.com/13/28');
  assert.equal(texteACopier({ ...verset, translit: undefined }, true), 'ٱلَّذِينَ ءَامَنُوا۟\n\nAr-Raʿd · 13:28\n\nhttps://quran.com/13/28');
});

test('le lien du verset', () => {
  assert.equal(lienVerset(2, 255), 'https://quran.com/2/255');
});

test('texte copié d\'une invocation : arabe et source, sans lien externe', () => {
  const inv = { texte: 'اللَّهُمَّ', translit: 'allahumma', source: 'Sahih Muslim 4:2088' };
  assert.equal(texteInvocationACopier(inv, false), 'اللَّهُمَّ\n\nSahih Muslim 4:2088');
  assert.equal(texteInvocationACopier(inv, true), 'اللَّهُمَّ\n\nallahumma\n\nSahih Muslim 4:2088');
  assert.equal(texteInvocationACopier({ ...inv, translit: undefined }, true), 'اللَّهُمَّ\n\nSahih Muslim 4:2088');
});
