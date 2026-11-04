// Journal local des erreurs : règles pures. Jamais le texte d'un message, jamais de donnée personnelle.

export const JOURNAL_MAX = 20;

export type EntreeJournal = {
  /** Horodatage ISO. */
  quand: string;
  /** Code support « ERR-3FA2 · 29/10 14:12 » (empreinte, voir `codeErreur`). */
  code: string;
  /** Nom de l'erreur seulement : « TypeError ». */
  type: string;
  source: 'ecran' | 'fatale';
  version: string;
  plateforme: string;
};

/** Ajoute une entrée en tête et garde les `JOURNAL_MAX` plus récentes. */
export function ajouterAuJournal(journal: EntreeJournal[], entree: EntreeJournal): EntreeJournal[] {
  return [entree, ...journal].slice(0, JOURNAL_MAX);
}

/** Journal relu depuis le stockage : les entrées mal formées sont écartées. */
export function lireJournal(brut: unknown): EntreeJournal[] {
  if (!Array.isArray(brut)) return [];
  return brut
    .filter(
      (e): e is EntreeJournal =>
        !!e &&
        typeof e === 'object' &&
        ['quand', 'code', 'type', 'version', 'plateforme'].every(
          (k) => typeof (e as Record<string, unknown>)[k] === 'string',
        ) &&
        ((e as Record<string, unknown>).source === 'ecran' || (e as Record<string, unknown>).source === 'fatale'),
    )
    .slice(0, JOURNAL_MAX);
}

/** Texte à partager : une ligne par erreur, la plus récente d'abord. */
export function journalEnTexte(journal: EntreeJournal[], entete: string): string {
  const lignes = journal.map((e) => `${e.quand} · ${e.code} · ${e.type} · ${e.source} · ${e.plateforme} ${e.version}`);
  return [entete, ...lignes].join('\n');
}
