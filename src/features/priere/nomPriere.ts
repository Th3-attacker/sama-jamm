// Nom d'une prière à une date donnée : le vendredi, la prière de midi s'appelle Jumu'a (prière du vendredi).
import type { TFunction } from 'i18next';

import type { NomPriere } from '@/stores/reglages';

const VENDREDI = 5;

/** Vrai pour la prière de midi d'un vendredi (jour du téléphone). */
export const estJumua = (nom: NomPriere, jour: Date): boolean => nom === 'dhuhr' && jour.getDay() === VENDREDI;

/** Nom affiché de la prière (« Jumu'a » le vendredi à midi), en français, anglais ou arabe selon `t`. */
export function nomPriere(t: TFunction, nom: NomPriere, jour: Date): string {
  return estJumua(nom, jour) ? t('priere.nomJumua') : t(`priere.noms.${nom}`);
}

/** Nom wolof de la prière (« Àjjuma » le vendredi à midi). */
export function nomLocalPriere(t: TFunction, nom: NomPriere, jour: Date): string {
  return estJumua(nom, jour) ? t('priere.nomLocalJumua') : t(`priere.nomsLocaux.${nom}`);
}
