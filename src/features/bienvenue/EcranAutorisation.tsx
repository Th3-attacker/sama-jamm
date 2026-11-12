import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvantAutorisation, type TypeAutorisation } from '@/features/autorisation/AvantAutorisation';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { TopBar } from '@/ui/TopBar';

type Props = {
  type: TypeAutorisation;
  onContinuer: () => void;
  enCours?: boolean;
  /** Message au-dessus du bouton (échec de la demande). */
  erreur?: string;
};

/** Écran entier « Avant la demande » du parcours de bienvenue : explication défilante, « Continuer » posé en bas. */
export function EcranAutorisation({ type, onContinuer, enCours = false, erreur }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace6, gap: espace.espace4 }}>
        <AvantAutorisation type={type} onContinuer={onContinuer} bouton={false} />
      </ScrollView>
      <View style={{ paddingHorizontal: espace.espace6, paddingBottom: Math.max(espace.espace4, insets.bottom), gap: espace.espace3 }}>
        {erreur ? <Banner ton="erreur">{erreur}</Banner> : null}
        <Button grand pleineLargeur disabled={enCours} onPress={onContinuer}>
          {t('commun.continuer')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
