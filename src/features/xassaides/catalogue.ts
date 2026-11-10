// Catalogue des xassaïdes : cinq sources de xassaid.com, relevées le 10 novembre 2026 (voir docs/deploiement/licences.md).
import donnees from './catalogue.json';
import { trouverPiste, trouverSource, type Piste, type Source } from './pistes';

const GENRES = ['xassaide', 'causerie'] as const;

export const SOURCES: readonly Source[] = donnees.sources.map((s) => ({
  ...s,
  genre: GENRES.find((g) => g === s.genre) ?? 'xassaide',
}));

export const sourceXassaides = (id: string): Source | undefined => trouverSource(SOURCES, id);

export const pisteXassaides = (idSource: string, idPiste: number): Piste | undefined =>
  trouverPiste(SOURCES, idSource, idPiste);
