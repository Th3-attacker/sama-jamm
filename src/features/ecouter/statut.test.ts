/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { erreurDuStatut, indexDuStatut, pisteSaine, sauteSansLecture } from './statut.ts';

test('erreur du statut : message Android, texte, ou rien', () => {
  assert.equal(erreurDuStatut({ playing: false, error: { message: 'Source error', code: 2004 } }), 'Source error');
  assert.equal(erreurDuStatut({ error: 'Délai' }), 'Délai');
  assert.equal(erreurDuStatut({ error: { code: 2001 } }), 'Erreur de lecture');
  assert.equal(erreurDuStatut({ error: null }), null);
  assert.equal(erreurDuStatut({ playing: true }), null);
  assert.equal(erreurDuStatut(null), null);
  assert.equal(erreurDuStatut('error'), null);
});

test('index du statut : entier positif, sinon la valeur par défaut', () => {
  assert.equal(indexDuStatut({ currentIndex: 4 }, 0), 4);
  assert.equal(indexDuStatut({ currentIndex: -1 }, 2), 2);
  assert.equal(indexDuStatut({ currentIndex: 1.5 }, 2), 2);
  assert.equal(indexDuStatut({}, 3), 3);
});

test('piste saine : chargée, ou en lecture avec du temps écoulé', () => {
  assert.equal(pisteSaine({ isLoaded: true, playing: false, currentTime: 0 }), true);
  assert.equal(pisteSaine({ isLoaded: false, playing: true, currentTime: 0.5 }), true);
  // Fichier injoignable : jamais chargé, la lecture attend sans avancer.
  assert.equal(pisteSaine({ isLoaded: false, playing: false, isBuffering: true, currentTime: 0 }), false);
  assert.equal(pisteSaine({ isLoaded: false, playing: true, currentTime: 0 }), false);
  assert.equal(pisteSaine({ isLoaded: false, playing: true, currentTime: Number.NaN }), false);
  assert.equal(pisteSaine({ isLoaded: 'oui', playing: 1, currentTime: 3 }), false);
  assert.equal(pisteSaine({}), false);
  assert.equal(pisteSaine(null), false);
});

test('piste sautée sans lecture : passage à la suivante sans chargement ni saut demandé', () => {
  const passage = { previousIndex: 4, currentIndex: 5, sautVers: null, saine: false };
  assert.equal(sauteSansLecture(passage), true);
  // Fin naturelle d'un verset qui a été lu.
  assert.equal(sauteSansLecture({ ...passage, saine: true }), false);
  // « Suivant » ou nouvelle écoute : le saut est voulu, même sur une piste pas encore chargée.
  assert.equal(sauteSansLecture({ ...passage, sautVers: 5 }), false);
  // Un saut demandé vers une autre piste ne couvre pas celui-ci (première piste d'une écoute).
  assert.equal(sauteSansLecture({ previousIndex: 0, currentIndex: 1, sautVers: 0, saine: false }), true);
  // Retour en arrière, boucle ou placement ailleurs : ce n'est pas un passage à la suivante.
  assert.equal(sauteSansLecture({ ...passage, currentIndex: 3 }), false);
  assert.equal(sauteSansLecture({ previousIndex: 119, currentIndex: 0, sautVers: null, saine: false }), false);
});
