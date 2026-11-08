import { miseEnPage } from './tokens.generated.ts';

/** Outil fixe du bas : compteur (Dhikr, Invocations) ou pilule (lecteur de verset). Jamais les deux. */
export type OutilBas = 'aucun' | 'compteur' | 'pilule';

export type EntreePile = {
  /** Hauteur de la fenêtre (useWindowDimensions). */
  hauteurFenetre: number;
  /** Hauteur de la zone de la barre d'onglets, mesurée à l'exécution (sonde), zone de sécurité comprise. */
  hauteurBarre: number;
  /** Un audio est en cours et le mini-lecteur peut s'afficher. */
  miniActif: boolean;
  outil: OutilBas;
  /** Hauteur réelle du mini-lecteur (texte agrandi compris) : prime sur la cible du design si elle est plus grande. */
  miniMesure?: number;
  /** Hauteur réelle du compteur ou de la pilule (marges comprises) : prime sur la cible si elle est plus grande. */
  outilMesure?: number;
};

export type PileBas = {
  barre: number;
  mini: number;
  outil: number;
  /** Vrai si le plafond a rangé le mini-lecteur (l'audio continue, la commande passe dans la barre du haut). */
  miniRange: boolean;
  /** Hauteur totale de la pile visible. */
  total: number;
  /** Pile sans l'outil fixe : ce que le compteur ou la pilule doit laisser libre sous lui. */
  dessousOutil: number;
  /** Marge basse des contenus défilants : pile visible + marge de contenu. */
  margeContenu: number;
};

function empiler(barre: number, mini: number, outil: OutilBas, outilMesure = 0) {
  const cibleOutil = outil === 'compteur' ? miseEnPage.compteurFixe : outil === 'pilule' ? miseEnPage.piluleOutils : 0;
  const hOutil = cibleOutil > 0 ? Math.max(cibleOutil, outilMesure) : 0;
  // Écart de 8 entre couches ; la pilule se pose à 16 au-dessus de la couche du dessous.
  const ecartOutil = outil === 'pilule' ? miseEnPage.margeContenuBas : miseEnPage.ecartCouches;
  let total = barre;
  if (mini > 0) total += miseEnPage.ecartCouches + mini;
  if (hOutil > 0) total += ecartOutil + hOutil;
  return { outil: hOutil, total };
}

/** Calcule la pile du bas (design 18 « Le bas de l'écran »). Fonction pure, testée sans React Native. */
export function calculerPile(e: EntreePile): PileBas {
  const miniPlein = e.outil === 'compteur' ? miseEnPage.miniLecteurMince : miseEnPage.miniLecteur;
  let mini = e.miniActif ? Math.max(miniPlein, e.miniMesure ?? 0) : 0;
  let { outil, total } = empiler(e.hauteurBarre, mini, e.outil, e.outilMesure);
  let miniRange = false;
  if (mini > 0 && total > miseEnPage.plafondPile * e.hauteurFenetre) {
    miniRange = true;
    mini = 0;
    ({ outil, total } = empiler(e.hauteurBarre, 0, e.outil, e.outilMesure));
  }
  return {
    barre: e.hauteurBarre,
    mini,
    outil,
    miniRange,
    total,
    dessousOutil: total - (outil > 0 ? outil + (e.outil === 'pilule' ? miseEnPage.margeContenuBas : miseEnPage.ecartCouches) : 0),
    margeContenu: total + miseEnPage.margeContenuBas,
  };
}
