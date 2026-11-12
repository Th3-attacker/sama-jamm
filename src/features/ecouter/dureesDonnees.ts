// Durées des versets (dixièmes de seconde, estimées d'après la taille des fichiers à 64 kbit/s constant,
// voir scripts/durees-versets.mjs). Sert au temps écoulé et restant du lecteur du Coran.
import durees from '@/data/coran/durees.json';
import { sourates } from '@/features/lire/coran';

export const VERSETS_PAR_SOURATE: readonly number[] = sourates.map((s) => s.versets);

type Durees = Record<string, readonly number[] | undefined>;

/** Durées d'un récitateur, ou undefined s'il n'en a pas (alors le lecteur n'affiche pas de temps). */
export const dureesDe = (idRecitateur: string): readonly number[] | undefined => (durees as Durees)[idRecitateur];
