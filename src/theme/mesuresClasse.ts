import type { ClasseLargeur } from './classesFenetre.ts';
import { miseEnPage } from './tokens.generated.ts';

export type MesuresClasse = {
  /** Marge latérale des écrans racines. */
  marge: number;
  /** Largeur maximale du texte sacré et des traductions. */
  colonneLecture: number;
  /** Largeur du volet liste de Lire ; 0 hors classe étendue (une seule colonne). */
  panneauListe: number;
  /** Nombre de colonnes de contenu : 2 à partir de la classe étendue. */
  colonnes: 1 | 2;
};

/** Mesures de mise en page selon la classe de largeur (design 18, « Marges, hauteurs, défilement »). */
export function mesuresClasse(classe: ClasseLargeur): MesuresClasse {
  const etendue = classe === 'etendue' || classe === 'grande' || classe === 'tresGrande';
  return {
    marge: classe === 'compacte' ? miseEnPage.margeCompacte : etendue ? miseEnPage.margeEtendue : miseEnPage.margeMoyenne,
    colonneLecture: miseEnPage.colonneLecture,
    panneauListe: etendue ? miseEnPage.panneauListe : 0,
    colonnes: etendue ? 2 : 1,
  };
}
