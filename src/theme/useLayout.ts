import { mesuresClasse } from './mesuresClasse';
import { useWindowClass } from './useWindowClass';

/** Classes de la fenêtre et mesures de mise en page associées. Relu à chaque changement de taille. */
export function useLayout() {
  const classes = useWindowClass();
  const mesures = mesuresClasse(classes.largeur);
  return {
    ...classes,
    ...mesures,
    /**
     * Style du contenu d'un écran racine : marge latérale de la classe, colonne centrée de 760 au plus (marges
     * comprises dans la largeur). À fusionner dans `contentContainerStyle`.
     */
    styleColonne: {
      paddingHorizontal: mesures.marge,
      width: '100%',
      maxWidth: mesures.colonneLecture + 2 * mesures.marge,
      alignSelf: 'center',
    } as const,
  };
}
