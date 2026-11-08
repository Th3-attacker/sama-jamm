import { mesuresClasse } from './mesuresClasse';
import { useWindowClass } from './useWindowClass';

/** Classes de la fenêtre et mesures de mise en page associées. Relu à chaque changement de taille. */
export function useLayout() {
  const classes = useWindowClass();
  return { ...classes, ...mesuresClasse(classes.largeur) };
}
