import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appliquerSensEtRedemarrer, demandeRedemarrage } from '@/features/bienvenue/sensDeLecture';
import { estLangue, type Langue } from '@/i18n/langues';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Dialog } from '@/ui/Dialog';
import { PageDots } from '@/ui/PageDots';

// Noms des langues dans leur propre langue : ils ne se traduisent pas.
const OPTIONS: { id: Langue; label: string; arabe?: boolean }[] = [
  { id: 'wo', label: 'Wolof' },
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية', arabe: true },
];

export default function EcranLangue() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const langueEnregistree = useReglages((s) => s.langue);
  const definirLangue = useReglages((s) => s.definirLangue);
  const definirTraduction = useReglages((s) => s.definirTraduction);
  const [confirmation, setConfirmation] = useState(false);
  const [redemarrageManuel, setRedemarrageManuel] = useState(false);

  const choisie: Langue = langueEnregistree ?? (estLangue(i18n.language) ? i18n.language : 'fr');
  const ivoire = couleurs.marqueIvoire;

  const choisir = (langue: Langue) => {
    definirLangue(langue);
    // La traduction du Coran suit la langue ; en interface arabe, le français par défaut.
    definirTraduction(langue === 'ar' ? 'fr' : langue);
  };

  const continuer = () => {
    if (!langueEnregistree) choisir(choisie);
    if (demandeRedemarrage(choisie)) setConfirmation(true);
    else router.push('/position');
  };

  const redemarrer = () => {
    setConfirmation(false);
    appliquerSensEtRedemarrer(choisie).then((ok) => {
      if (!ok) setRedemarrageManuel(true);
    }).catch((erreur: unknown) => {
      console.error('Changement de sens de lecture impossible', erreur);
      setRedemarrageManuel(true);
    });
  };

  return (
    <SafeAreaView style={[styles.ecran, { backgroundColor: couleurs.marqueEmeraude, padding: espace.espace6 }]}>
      <StatusBar style="light" />
      <View style={[styles.haut, { gap: espace.espace3, paddingTop: espace.espace12 }]}>
        <Text accessibilityRole="header" accessibilityLanguage="wo" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.display, { color: ivoire, fontSize: 52, lineHeight: 56 }]}>
          {t('bienvenue.langueTitre')}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, { color: ivoire, fontSize: 18, lineHeight: 28, opacity: 0.85 }]}>
          {t('bienvenue.langueSousTitre')}
        </Text>
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel={t('bienvenue.langueQuestion')} style={{ gap: espace.espace3 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: ivoire, opacity: 0.85 }]}>
          {t('bienvenue.langueQuestion')}
        </Text>
        {OPTIONS.map((o) => {
          const on = o.id === choisie;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLanguage={o.id}
              onPress={() => choisir(o.id)}
              style={[
                styles.option,
                {
                  minHeight: 56,
                  paddingHorizontal: espace.espace5,
                  borderRadius: rayon.rayonCarte,
                  borderColor: ivoire,
                  backgroundColor: on ? ivoire : 'transparent',
                  opacity: on ? 1 : 0.9,
                },
              ]}>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[o.arabe ? typographie.arabe : typographie.titre3, { color: on ? couleurs.marqueEmeraude : ivoire, lineHeight: o.arabe ? 34 : 24 }]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {redemarrageManuel ? (
        <View style={{ marginTop: espace.espace4 }}>
          <Banner ton="info">{t('bienvenue.redemarrerManuel')}</Banner>
        </View>
      ) : null}

      <View style={[styles.bas, { marginTop: espace.espace8 }]}>
        <PageDots total={3} actif={0} />
        <Pressable
          accessibilityRole="button"
          onPress={continuer}
          style={({ pressed }) => [
            styles.continuer,
            { minHeight: cible.cibleAndroid, paddingHorizontal: espace.espace6, borderRadius: rayon.rayonCarte, backgroundColor: ivoire, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.marqueEmeraude, fontSize: 16 }]}>
            {t('commun.continuer')}
          </Text>
        </Pressable>
      </View>

      <Dialog
        ouvert={confirmation}
        titre={t('bienvenue.redemarrer')}
        confirmer={t('bienvenue.redemarrer')}
        icone="globe"
        onConfirmer={redemarrer}
        onAnnuler={() => setConfirmation(false)}>
        {choisie === 'ar' ? t('bienvenue.langueRedemarrage') : t('bienvenue.langueRedemarrageLtr')}
      </Dialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  haut: { flex: 1 },
  option: { justifyContent: 'center', borderWidth: 1 },
  bas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continuer: { alignItems: 'center', justifyContent: 'center' },
});
