// Titre affiché d'une invocation : les données portent « Invocation 12 » en français ; l'interface le reconstruit
// dans la langue choisie à partir du numéro. Un autre titre est rendu tel quel.
const TITRE_NUMEROTE = /^Invocation (\d+)$/;

export function titreInvocation(titre: string, numerote: (n: number) => string): string {
  const m = TITRE_NUMEROTE.exec(titre);
  return m ? numerote(Number(m[1])) : titre;
}
