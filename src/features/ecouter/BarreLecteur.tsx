import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BarreTemps } from '@/ui/BarreTemps';

import { tempsSourate } from './durees';
import { dureesDe, VERSETS_PAR_SOURATE } from './dureesDonnees';
import { chercherSourate, useLecteur } from './lecteur';
import { formatTemps } from './temps';

/**
 * Barre de temps du lecteur plein écran. Elle lit elle-même le temps du lecteur : les mises à jour fréquentes ne
 * redessinent que la barre, pas le verset ni le reste de l'écran.
 */
export function BarreLecteur() {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
  const position = useLecteur((s) => s.position ?? s.derniere);
  const tempsPiste = useLecteur((s) => (s.position ? s.temps : 0));
  const page = useLecteur((s) => s.page);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const enLecture = useLecteur((s) => s.enLecture);
  const chargement = useLecteur((s) => s.chargement);
  const vitesse = useLecteur((s) => s.vitesse);
  // Temps de la sourate d'après la durée des versets du récitateur ; sans durées, on garde « Verset N sur M ».
  const temps = useMemo(
    () => (position ? tempsSourate(dureesDe(idRecitateur), VERSETS_PAR_SOURATE, position.sourate, position.verset, tempsPiste) : null),
    [idRecitateur, position, tempsPiste],
  );
  const s = position ? sourate(position.sourate) : undefined;
  if (!position || !s) return null;

  if (temps) {
    return (
      <BarreTemps
        label={t('ecouter.positionSourate')}
        temps={temps.ecoule}
        duree={temps.total}
        // Glissable en écoute par sourate ; en écoute page par page, la barre s'affiche sans se déplacer.
        onChercher={page === null ? chercherSourate : undefined}
        format={formatTemps}
        pas={15}
        restant
        enLecture={enLecture}
        vitesse={vitesse}
        chargement={chargement && !enLecture}
        labelChargement={t('ecouter.chargement')}
      />
    );
  }
  return (
    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.centre, { color: couleurs.encre3 }]}>
      {page !== null
        ? `${t('lire.pageN', { n: page })} · ${t('ecouter.versetSur', { n: position.verset, total: s.versets })}`
        : t('ecouter.versetSur', { n: position.verset, total: s.versets })}
    </Text>
  );
}

const styles = StyleSheet.create({ centre: { textAlign: 'center' } });
