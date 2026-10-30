// Formules de dhikr proposées (section Prières et rappels du design system).
// Textes arabes et translittérations à faire valider par le référent religieux avant publication.

export type Formule = {
  id: string;
  arabe: string;
  translitteration: string;
  objectif: number;
};

export const formules: readonly Formule[] = [
  { id: 'subhanallah', arabe: 'سُبْحَانَ ٱللَّٰهِ', translitteration: 'Subḥāna-llāh', objectif: 33 },
  { id: 'alhamdulillah', arabe: 'ٱلْحَمْدُ لِلَّٰهِ', translitteration: 'Al-ḥamdu li-llāh', objectif: 33 },
  { id: 'allahuakbar', arabe: 'ٱللَّٰهُ أَكْبَرُ', translitteration: 'Allāhu akbar', objectif: 34 },
  { id: 'lailahaillallah', arabe: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', translitteration: 'Lā ilāha illa-llāh', objectif: 100 },
  { id: 'astaghfirullah', arabe: 'أَسْتَغْفِرُ ٱللَّٰهَ', translitteration: 'Astaghfiru-llāh', objectif: 100 },
];

/** Identifiant de la formule libre : pas de texte, l'utilisateur compte ce qu'il récite. */
export const FORMULE_LIBRE = 'libre';

export const objectifsProposes = [33, 99, 100] as const;
