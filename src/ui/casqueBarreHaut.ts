/**
 * Le casque de la barre du haut remplace le mini-lecteur quand le plafond de la pile l'a rangé (design 18) :
 * une écoute est en cours, le mini-lecteur est rangé, et l'écran n'est pas le lecteur lui-même.
 */
export function montrerCasque(e: { enEcoute: boolean; miniRange: boolean; chemin: string }): boolean {
  return e.enEcoute && e.miniRange && e.chemin !== '/lecteur';
}
