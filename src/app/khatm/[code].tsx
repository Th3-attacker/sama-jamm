import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/compte/compte';
import { apercuKhatm, estTropDeTentatives, rejoindreKhatm, type Apercu } from '@/features/khatm/depot';
import { lireCode } from '@/features/khatm/logique';
import { useParametre } from '@/hooks/useParametre';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { TopBar } from '@/ui/TopBar';

import { interlignes, tailles } from '@/theme/tokens.generated';
/** Invitation au khatm, ouverte par le lien samajamm://khatm/CODE (ou un code saisi). */
export default function Invitation() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, latin, ligne } = useTheme();
  const code = lireCode(useParametre('code'));
  const connecte = useSession((s) => s.session !== null);
  const [apercu, setApercu] = useState<Apercu | null | 'chargement'>('chargement');
  /** `quota` : plus de 30 essais de code dans l'heure (limite du serveur). */
  const [erreur, setErreur] = useState<'aucune' | 'generique' | 'quota'>('aucune');
  /** Adhésion en cours : bloque le double appui (chaque appui consomme une tentative côté serveur). */
  const [envoi, setEnvoi] = useState(false);
  // Nouveau code (autre lien ouvert) : l'erreur du code précédent ne vaut plus.
  const [codeVu, setCodeVu] = useState(code);
  if (codeVu !== code) {
    setCodeVu(code);
    setErreur('aucune');
  }

  useEffect(() => {
    if (!connecte || !code) return;
    apercuKhatm(code)
      .then(setApercu)
      .catch((e: unknown) => {
        console.warn('Invitation illisible', e);
        if (estTropDeTentatives(e)) setErreur('quota');
        setApercu(null);
      });
  }, [connecte, code]);

  const rejoindre = async () => {
    if (!code || envoi) return;
    setEnvoi(true);
    setErreur('aucune');
    try {
      const id = await rejoindreKhatm(code);
      // Code devenu inconnu entre l'aperçu et l'adhésion (khatm supprimé) : même écran que le lien expiré.
      if (id === null) setApercu(null);
      else router.replace({ pathname: '/plus/khatm/[id]', params: { id } });
    } catch (e: unknown) {
      console.warn('Khatm non rejoint', e);
      setErreur(estTropDeTentatives(e) ? 'quota' : 'generique');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour
        onRetour={() => (router.canGoBack() ? router.back() : router.replace('/accueil'))}
      />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: espace.espace6,
          paddingBottom: espace.espace5,
          gap: espace.espace4,
        }}>
        <View style={{ gap: espace.espace1 }}>
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[latin.titre1, { color: couleurs.emeraude }]}>
            {t('formules.entraide')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, ligne(styles.trad), { color: couleurs.encre2 }]}>
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
            {/* Carte d'invitation : qui invite, pour quoi, et ce qu'il reste à prendre. */}
            <View
              style={{
                backgroundColor: couleurs.orDoux,
                borderRadius: rayon.rayonCarte,
                padding: espace.espace4,
                gap: espace.espace1,
              }}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
                <Trans
                  i18nKey="khatm.invitation"
                  values={{ prenom: apercu.invite_par ?? t('khatm.quelquun'), nom: apercu.nom }}
                  components={{ nom: <Text style={styles.gras} /> }}
                />
              </Text>
              {apercu.intention ? (
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
                  {apercu.intention}
                </Text>
              ) : null}
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.regulier, { color: couleurs.encre2 }]}>
                {[
                  t('khatm.libresRestants', { count: apercu.libres }),
                  apercu.echeance
                    ? `${t('khatm.echeance').toLowerCase()} ${new Date(`${apercu.echeance}T12:00:00`).toLocaleDateString(i18n.language, {
                        day: 'numeric',
                        month: 'long',
                      })}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            {erreur === 'quota' ? (
              <Banner ton="erreur">{t('khatm.tropDeTentatives')}</Banner>
            ) : erreur === 'generique' ? (
              <Banner ton="erreur">{t('etats.erreurTexte')}</Banner>
            ) : null}
            {/* Pied de page collé en bas, comme la planche. */}
            <View style={[styles.pied, { gap: espace.espace2 }]}>
              <Button grand pleineLargeur disabled={envoi} onPress={rejoindre}>
                {t('khatm.rejoindre')}
              </Button>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.regulier, styles.centre, { color: couleurs.encre3 }]}>
                {t('khatm.rendreAide')}
              </Text>
            </View>
          </>
        ) : erreur === 'quota' ? (
          <Banner ton="erreur">{t('khatm.tropDeTentatives')}</Banner>
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
  trad: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  gras: { fontFamily: 'SourceSans3_600SemiBold' },
  regulier: { fontFamily: 'SourceSans3_400Regular' },
  centre: { textAlign: 'center' },
  pied: { marginTop: 'auto' },
});
