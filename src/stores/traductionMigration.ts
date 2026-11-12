// Le Coran s'affiche en arabe seul : les réglages « traduction » et « affichage » n'existent plus.
// Un ancien téléphone les a encore enregistrés ; on les efface sans toucher au reste (la translittération reste
// telle que l'utilisateur l'a choisie).
export function retirerTraduction(etat: Record<string, unknown>): void {
  delete etat.traduction;
  delete etat.affichage;
}
