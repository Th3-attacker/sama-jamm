/**
 * Le casque de la barre du haut remplace le mini-lecteur quand le plafond de la pile l'a rangé (design 18) :
 * une écoute est en cours, le mini-lecteur est rangé, l'écran n'est pas le lecteur lui-même, et la barre n'a pas
 * déjà un casque dans ses actions (mode page du Coran : « Écouter la page »).
 */
export function montrerCasque(e: { enEcoute: boolean; miniRange: boolean; chemin: string; casqueDejaPresent: boolean }): boolean {
  return e.enEcoute && e.miniRange && e.chemin !== '/lecteur' && !e.casqueDejaPresent;
}
