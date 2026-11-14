/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SITE, URL_VERSION } from '../../constants/liens.ts';
import { comparerVersions, lireFichierVersion, miseAJourExigee } from './version.ts';

const MAGASIN = 'https://play.google.com/store/apps/details?id=com.samajamm.app';

test('versions comparées chiffre à chiffre', () => {
  assert.ok(comparerVersions('1.0.0', '1.2.0') < 0);
  assert.ok(comparerVersions('1.10.0', '1.9.9') > 0);
  assert.equal(comparerVersions('1.2', '1.2.0'), 0);
  assert.ok(comparerVersions('2', '1.99.99') > 0);
});

test('fichier de version : seules les consignes valides sont gardées', () => {
  assert.deepEqual(lireFichierVersion({ android: { minimum: '1.2.0', magasin: MAGASIN } }), {
    android: { minimum: '1.2.0', magasin: MAGASIN },
  });
  assert.deepEqual(lireFichierVersion({ android: { minimum: 'beta', magasin: MAGASIN } }), {});
  assert.deepEqual(lireFichierVersion({ ios: { minimum: '1.0.0', magasin: 'http://x' } }), {});
  assert.deepEqual(lireFichierVersion(null), {});
});

test('le lien du magasin doit être celui de la plateforme, en https', () => {
  const ios = 'https://apps.apple.com/app/id123456789';
  assert.deepEqual(lireFichierVersion({ ios: { minimum: '1.0.0', magasin: ios } }), { ios: { minimum: '1.0.0', magasin: ios } });
  // Mauvais magasin pour la plateforme, faux sous-domaine, identifiant glissé avant l'hôte, autre site.
  assert.deepEqual(lireFichierVersion({ android: { minimum: '1.0.0', magasin: ios } }), {});
  assert.deepEqual(lireFichierVersion({ ios: { minimum: '1.0.0', magasin: MAGASIN } }), {});
  assert.deepEqual(lireFichierVersion({ android: { minimum: '1.0.0', magasin: 'https://play.google.com.exemple.fr/x' } }), {});
  assert.deepEqual(lireFichierVersion({ android: { minimum: '1.0.0', magasin: 'https://play.google.com@exemple.fr/x' } }), {});
  assert.deepEqual(lireFichierVersion({ android: { minimum: '1.0.0', magasin: 'https://exemple.fr/hameconnage' } }), {});
  assert.deepEqual(lireFichierVersion('texte'), {});
});

test('mise à jour exigée seulement sous le minimum de sa plateforme', () => {
  const f = lireFichierVersion({ android: { minimum: '1.2.0', magasin: MAGASIN } });
  assert.equal(miseAJourExigee('1.0.0', f, 'android')?.minimum, '1.2.0');
  assert.equal(miseAJourExigee('1.2.0', f, 'android'), null);
  assert.equal(miseAJourExigee('1.0.0', f, 'ios'), null);
  assert.equal(miseAJourExigee(null, f, 'android'), null);
});

test('version.json est publié sur le même site que les pages légales', () => {
  assert.ok(URL_VERSION.startsWith(`${SITE}/`));
  assert.ok(URL_VERSION.startsWith('https://'));
});
