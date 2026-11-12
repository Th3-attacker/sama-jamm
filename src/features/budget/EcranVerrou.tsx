import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Etoile } from '@/ui/Etoile';
import { Icon } from '@/ui/Icon';

import { rayon } from '@/theme/tokens.generated';
const TAILLE_ETOILE = 88;

type Props = { deverrouiller: () => Promise<boolean> };

/** Budget verrouillé : il reste chiffré sur ce téléphone ; l'empreinte, le visage ou le code l'ouvrent. */
export function EcranVerrou({ deverrouiller }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [echec, setEchec] = useState(false);
  const demande = useRef(false);

  const essayer = () => {
    setEchec(false);
    deverrouiller()
      .then((ok) => setEchec(!ok))
      .catch((erreur: unknown) => {
        console.warn('Déverrouillage impossible', erreur);
        setEchec(true);
      });
  };

  // Une seule demande automatique à l'affichage ; ensuite, le bouton.
  useEffect(() => {
    if (demande.current) return;
    demande.current = true;
    essayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- demande unique à l'affichage
  }, []);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond, padding: espace.espace8 }]}>
      <View style={[styles.centre, { gap: espace.espace3 }]}>
        <View style={[styles.marque, { marginBottom: espace.espace2 }]}>
          <Etoile taille={TAILLE_ETOILE} remplissage={couleurs.orDoux} contour={couleurs.or} />
          <View
            style={[
              styles.cadenas,
              { backgroundColor: couleurs.surface, borderColor: couleurs.ligne },
            ]}>
            <Icon name="lock" size={18} color={couleurs.emeraude} />
          </View>
        </View>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.titre1, styles.texte, { color: couleurs.emeraude }]}>
          {t('budget.verrouTitre')}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.texte, { color: couleurs.encre2 }]}>
          {t('budget.verrouTexte')}
        </Text>
        <View style={[styles.action, { gap: espace.espace2, marginTop: espace.espace5 }]}>
          <Button variant="principal" icone="lock" pleineLargeur onPress={essayer}>
            {t('budget.deverrouiller')}
          </Button>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.libelle, styles.texte, styles.aide, { color: couleurs.encre3 }]}>
            {t('budget.deverrouillerAide')}
          </Text>
          {echec ? <Banner ton="info">{t('budget.verrouEchec')}</Banner> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, justifyContent: 'center' },
  centre: { alignItems: 'center' },
  marque: { width: TAILLE_ETOILE, height: TAILLE_ETOILE, alignItems: 'center', justifyContent: 'center' },
  // Pastille cadenas posée sur le coin bas droit de l'étoile.
  cadenas: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 36,
    height: 36,
    borderRadius: rayon.rayonPastille,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: { textAlign: 'center', maxWidth: 300 },
  action: { alignSelf: 'stretch', alignItems: 'stretch' },
  aide: { fontFamily: 'SourceSans3_400Regular' },
});
