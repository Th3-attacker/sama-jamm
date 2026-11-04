import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { EmptyState } from '@/ui/EmptyState';

type Props = { deverrouiller: () => Promise<boolean> };

/** Budget verrouillé : il reste chiffré sur ce téléphone ; l'empreinte, le visage ou le code l'ouvrent. */
export function EcranVerrou({ deverrouiller }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
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
    <View style={[styles.ecran, { backgroundColor: couleurs.fond, padding: espace.espace5, gap: espace.espace4 }]}>
      <EmptyState
        icone="lock"
        titre={t('budget.verrouTitre')}
        lang="fr"
        texte={t('budget.verrouTexte')}
        action={{ label: t('budget.deverrouiller'), icone: 'lock', onPress: essayer }}
      />
      {echec ? <Banner ton="info">{t('budget.verrouEchec')}</Banner> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, justifyContent: 'center' },
});
