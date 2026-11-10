/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { formatTemps, tempsApresSaut, trouverPiste, trouverSource, urlPiste, type Source } from './pistes.ts';

const { sources } = JSON.parse(readFileSync('src/features/xassaides/catalogue.json', 'utf8')) as {
  sources: Source[];
};

test('le catalogue contient les cinq sources demandées, dans l’ordre', () => {
  assert.deepEqual(
    sources.map((s) => [s.id, s.pistes.length]),
    [
      ['baye-moustapha-diop', 37],
      ['serigne-alioune-fall', 41],
      ['baye-madieye-diop', 2],
      ['nasroul-mouminina', 8],
      ['serigne-sam-mbaye', 50],
    ],
  );
});

test('chaque piste a un identifiant unique, un titre, une taille et un fichier MP3 déjà encodé', () => {
  const ids = new Set<number>();
  for (const s of sources) {
    assert.ok(s.genre === 'xassaide' || s.genre === 'causerie');
    const titres = new Set<string>();
    for (const p of s.pistes) {
      assert.ok(Number.isInteger(p.id) && p.id > 0);
      assert.ok(!ids.has(p.id), `identifiant en double : ${p.id}`);
      ids.add(p.id);
      assert.ok(p.titre.trim().length > 0);
      assert.ok(!titres.has(p.titre), `titre en double chez ${s.id} : ${p.titre}`);
      titres.add(p.titre);
      assert.ok(p.octets > 0);
      assert.match(p.chemin, /^[A-Za-z0-9%().,_'!*~-]+\.mp3$/, `chemin non encodé : ${p.chemin}`);
    }
  }
  assert.equal(ids.size, 138);
});

test('urlPiste donne une adresse valide sur files.xassaid.com', () => {
  for (const s of sources)
    for (const p of s.pistes) {
      const url = new URL(urlPiste(p));
      assert.equal(url.origin, 'https://files.xassaid.com');
      assert.ok(url.pathname.startsWith('/audios/'));
    }
});

test('trouverSource et trouverPiste', () => {
  assert.equal(trouverSource(sources, 'nasroul-mouminina')?.nom, 'Nasroul Mouminina');
  assert.equal(trouverSource(sources, 'inconnu'), undefined);
  assert.equal(trouverPiste(sources, 'baye-moustapha-diop', 278)?.titre, 'Alamane');
  assert.equal(trouverPiste(sources, 'baye-madieye-diop', 278), undefined);
});

test('formatTemps', () => {
  assert.equal(formatTemps(0), '0:00');
  assert.equal(formatTemps(65.9), '1:05');
  assert.equal(formatTemps(3725), '1:02:05');
  assert.equal(formatTemps(Number.NaN), '0:00');
  assert.equal(formatTemps(-3), '0:00');
});

test('tempsApresSaut reste entre le début et la fin', () => {
  assert.equal(tempsApresSaut(10, -15, 100), 0);
  assert.equal(tempsApresSaut(95, 15, 100), 100);
  assert.equal(tempsApresSaut(40, 15, 100), 55);
  assert.equal(tempsApresSaut(40, 15, 0), 55);
});
