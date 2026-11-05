import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/compte/compte';
import { apercuKhatm, rejoindreKhatm, type Apercu } from '@/features/khatm/depot';
import { lireCode } from '@/features/khatm/logique';
import { useParametre } from '@/hooks/useParametre';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { TopBar } from '@/ui/TopBar';

/** Invitation au khatm, ouverte par le lien samajamm://khatm/CODE (ou un code saisi). */
export default function Invitation() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, latin } = useTheme();
  const code = lireCode(useParametre('code'));
  const connecte = useSession((s) => s.session !== null);
  const [apercu, setApercu] = useState<Apercu | null | 'chargement'>('chargement');
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!connecte || !code) return;
    apercuKhatm(code)
      .then(setApercu)
      .catch((e: unknown) => {
        console.warn('Invitation illisible', e);
        setApercu(null);
      });
  }, [connecte, code]);

  const rejoindre = async () => {
    if (!code) return;
    setErreur(false);
    try {
      const id = await rejoindreKhatm(code);
      router.replace({ pathname: '/plus/khatm/[id]', params: { id } });
    } catch (e: unknown) {
      console.warn('Khatm non rejoint', e);
      setErreur(true);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour
        onRetour={() => (router.canGoBack() ? router.back() : router.replace('/accueil'))}
        titre={t('khatm.invitationTitre')}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <View>
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[latin.titre1, { color: couleurs.emeraude }]}>
            {t('formules.entraide')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {t('formules.entraideTrad')}
          </Text>
        </View>
        {!connecte ? (
          <Banner
            ton="info"
            action={{ label: t('compte.connexionTitre'), onPress: () => router.push('/plus/connexion') }}>
            {t('khatm.compteNecessaire')}
          </Banner>
        ) : code && apercu === 'chargement' ? (
          <ActivityIndicator />
        ) : code && apercu && apercu !== 'chargement' ? (
          <>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.encre }]}>
              {t('khatm.invitation', { prenom: apercu.invite_par ?? t('khatm.quelquun'), nom: apercu.nom })}
            </Text>
            {apercu.intention ? (
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
                {apercu.intention}
              </Text>
            ) : null}
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('khatm.libresRestants', { count: apercu.libres })}
            </Text>
            {erreur ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
            <Button icone="users" pleineLargeur onPress={rejoindre}>
              {t('khatm.rejoindre')}
            </Button>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('khatm.rendreAide')}
            </Text>
          </>
        ) : (
          <Banner ton="attention" titre={t('khatm.lienExpire')}>
            {t('khatm.lienExpireTexte')}
          </Banner>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
