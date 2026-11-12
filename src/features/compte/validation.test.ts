/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  codePropre,
  detailConnexion,
  emailPropre,
  ErreurConnexion,
  estRetourConnexion,
  lireRetourOAuth,
  prenomPropre,
  saisieCode,
} from './validation.ts';

test('e-mail : nettoyé, minuscules, refus des adresses incomplètes', () => {
  assert.equal(emailPropre('  Awa.Ndiaye@Exemple.SN '), 'awa.ndiaye@exemple.sn');
  assert.equal(emailPropre('awa@exemple'), null);
  assert.equal(emailPropre('awa exemple.sn'), null);
  assert.equal(emailPropre(''), null);
});

test('code : 6 chiffres, espaces ignorés', () => {
  assert.equal(codePropre('123 456'), '123456');
  assert.equal(codePropre('12345'), null);
  assert.equal(codePropre('12a456'), null);
});

test('prénom : facultatif, 40 caractères au plus', () => {
  assert.equal(prenomPropre('  Awa   Ndiaye '), 'Awa Ndiaye');
  assert.equal(prenomPropre('   '), null);
  assert.equal(prenomPropre('a'.repeat(41)), undefined);
});

test('retour de connexion : seulement le chemin auth', () => {
  assert.equal(estRetourConnexion('samajamm://auth?code=abc'), true);
  assert.equal(estRetourConnexion('exp://192.168.1.2:8081/--/auth?code=abc'), true);
  assert.equal(estRetourConnexion('/auth'), true);
  assert.equal(estRetourConnexion('samajamm://khatm/ABCD2345'), false);
  assert.equal(estRetourConnexion('/plus/authentique'), false);
});

test('retour OAuth : code, erreur ou rien', () => {
  assert.deepEqual(lireRetourOAuth('samajamm://auth?code=12-ab'), { code: '12-ab' });
  assert.deepEqual(lireRetourOAuth('samajamm://auth#error=access_denied&error_description=Refus%C3%A9'), {
    erreur: 'Refusé',
  });
  assert.equal(lireRetourOAuth('samajamm://auth'), null);
});

test('détail de connexion : étape et code technique, jamais de texte libre', () => {
  assert.equal(detailConnexion(new ErreurConnexion('retour_sans_code')), 'retour_sans_code');
  assert.equal(detailConnexion(new ErreurConnexion('echange', { code: 'bad_code_verifier', message: 'secret' })), 'echange:bad_code_verifier');
  assert.equal(detailConnexion(new ErreurConnexion('demarrage', { status: 400 })), 'demarrage:400');
  assert.equal(detailConnexion(new ErreurConnexion('echange', { code: 'a b<c>=1' })), 'echange:abc1');
  assert.equal(detailConnexion(new Error('autre')), undefined);
});

test('saisieCode : chiffres seulement, 6 au plus', () => {
  assert.equal(saisieCode('12a3 456 789'), '123456');
  assert.equal(saisieCode('abc'), '');
  assert.equal(saisieCode('1234567'), '123456');
});
