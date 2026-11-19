import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { BASE_AUDIO, numeroAudio, partEcoutee, urlAudio } from './audio.ts';

const { duas }: { duas: { id: string }[] } = JSON.parse(
  readFileSync(new URL('../../data/invocations/duas.json', import.meta.url), 'utf8'),
);

test('le numéro du fichier est le dernier nombre de l’identifiant', () => {
  assert.equal(numeroAudio('morning-27-66'), 66);
  assert.equal(numeroAudio('after_prayer-25-217'), 217);
  assert.equal(numeroAudio('d1'), null);
  assert.equal(numeroAudio('morning-27-'), null);
  assert.equal(urlAudio('travel-95-100'), `${BASE_AUDIO}/100.mp3`);
  assert.equal(urlAudio('inconnu'), null);
});

test('chaque invocation a un fichier, 59 fichiers distincts, matin et soir identiques', () => {
  const numeros = duas.map((d) => numeroAudio(d.id));
  assert.ok(numeros.every((n) => n !== null), 'identifiant sans numéro de fichier');
  assert.equal(new Set(numeros).size, 59);
  const matin = duas.filter((d) => d.id.startsWith('morning-')).map((d) => numeroAudio(d.id));
  const soir = duas.filter((d) => d.id.startsWith('evening-')).map((d) => numeroAudio(d.id));
  assert.deepEqual(matin, soir);
});

test('la part écoutée reste entre 0 et 1', () => {
  assert.equal(partEcoutee(5, 10), 0.5);
  assert.equal(partEcoutee(12, 10), 1);
  assert.equal(partEcoutee(-1, 10), 0);
  assert.equal(partEcoutee(3, 0), 0);
  assert.equal(partEcoutee(Number.NaN, 10), 0);
});
