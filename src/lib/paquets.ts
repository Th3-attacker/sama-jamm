// Construire une liste longue par paquets, en rendant la main entre deux paquets : l'écran reste fluide
// (frappe, défilement) pendant un calcul lourd sur le fil JavaScript.

/** Rend la main au fil JavaScript (événements, rendu) avant le paquet suivant. */
export const cederLaMain = () => new Promise<void>((resoudre) => setTimeout(resoudre, 0));

/** `construire(i)` pour i de 0 à n − 1, par paquets de `taille`, en cédant la main entre deux paquets. */
export async function parPaquets<T>(
  n: number,
  construire: (i: number) => T,
  taille: number,
  ceder: () => Promise<void> = cederLaMain,
): Promise<T[]> {
  if (!Number.isInteger(taille) || taille < 1)
    throw new RangeError('La taille d’un paquet doit être un entier positif.');
  const resultat: T[] = [];
  for (let debut = 0; debut < n; debut += taille) {
    for (let i = debut; i < Math.min(n, debut + taille); i++) resultat.push(construire(i));
    if (debut + taille < n) await ceder();
  }
  return resultat;
}
