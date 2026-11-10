// Un seul canal temps réel par khatm, partagé par tous les écrans qui le regardent (Accueil, Lire, écran du khatm).
// Supabase rend le canal existant quand on rouvre le même nom, et refuse d'y ajouter un écouteur une fois abonné :
// deux écrans ouverts ensemble faisaient planter le second. Logique sans Supabase, testable seule.

/** Ce que le registre sait faire d'un canal : écouter les changements, puis le fermer. */
export type Ouverture = (surChangement: () => void) => () => void;

export type RegistreCanaux = {
  /** S'abonne aux changements du khatm `id` ; renvoie la fonction qui se désabonne. */
  abonner: (id: string, rappel: () => void) => () => void;
};

/**
 * `ouvrir(id, surChangement)` ouvre vraiment le canal et renvoie sa fermeture. Le registre ne l'appelle qu'au premier
 * abonné d'un khatm, et ne ferme qu'au départ du dernier : le suivant rouvre un canal neuf.
 */
export function creerRegistreCanaux(ouvrir: (id: string, surChangement: () => void) => () => void): RegistreCanaux {
  const ouverts = new Map<string, { abonnes: Set<() => void>; fermer: () => void }>();

  return {
    abonner(id, rappel) {
      let canal = ouverts.get(id);
      if (!canal) {
        const abonnes = new Set<() => void>();
        // Copie : un rappel qui se désabonne pendant la diffusion ne perturbe pas les suivants.
        const fermer = ouvrir(id, () => [...abonnes].forEach((a) => a()));
        canal = { abonnes, fermer };
        ouverts.set(id, canal);
      }
      // Fonction propre à cet abonnement : le même rappel donné deux fois reste compté deux fois.
      const abonne = () => rappel();
      canal.abonnes.add(abonne);

      let actif = true;
      return () => {
        if (!actif) return;
        actif = false;
        const courant = ouverts.get(id);
        if (!courant) return;
        courant.abonnes.delete(abonne);
        if (courant.abonnes.size === 0) {
          ouverts.delete(id);
          courant.fermer();
        }
      };
    },
  };
}
