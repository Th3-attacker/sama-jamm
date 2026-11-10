import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  URL_AIDE,
  URL_CONDITIONS,
  URL_CONFIDENTIALITE,
  URL_STORE_ANDROID,
  URL_STORE_IOS,
} from '@/constants/liens';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { Logo } from '@/ui/Logo';
import { TopBar } from '@/ui/TopBar';

/** Sources regroupées comme dans la maquette : un titre, un résumé, le détail complet dans une feuille. */
const SOURCES = [
  { cle: 'coran', details: ['sourceCoran', 'sourceTanzil'] },
  { cle: 'traductions', details: ['sourceTraduction'] },
  { cle: 'recitations', details: ['sourceRecitations', 'sourceXassaides', 'sourceAdhan'] },
  { cle: 'invocations', details: ['sourceInvocations'] },
  { cle: 'polices', details: ['polices'] },
] as const;
type CleSource = (typeof SOURCES)[number]['cle'];

function ouvrir(url: string) {
  Linking.openURL(url).catch((e: unknown) => console.warn('Lien impossible à ouvrir', e));
}

/** À propos : signature, version, sources et licences, aide, confidentialité, avis, signaler un problème. */
export default function APropos() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, latin } = useTheme();
  const version = Constants.expoConfig?.version ?? '';
  const [detail, setDetail] = useState<CleSource | null>(null);
  const urlStore = Platform.OS === 'ios' ? URL_STORE_IOS : URL_STORE_ANDROID;
  const source = SOURCES.find((s) => s.cle === detail);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('aPropos.titre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace6,
        }}>
        <View style={[styles.entete, { gap: espace.espace4 }]}>
          <Logo taille={52} />
          <View style={styles.enteteTexte}>
            <Text
              accessibilityLanguage="wo"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[latin.titre2, { color: couleurs.encre }]}>
              {t('demarrage.signature')}
            </Text>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('aPropos.version', { version })}
            </Text>
          </View>
        </View>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('aPropos.texte')}
        </Text>

        <ListGroup titre={t('aPropos.sources')}>
          {SOURCES.map((s) => (
            <ListItem
              key={s.cle}
              titre={t(`aPropos.groupes.${s.cle}.titre`)}
              sousTitre={t(`aPropos.groupes.${s.cle}.resume`)}
              fin="chevron"
              onPress={() => setDetail(s.cle)}
            />
          ))}
        </ListGroup>

        <ListGroup>
          <ListItem icone="user" titre={t('aide.titre')} onPress={() => router.push('/plus/aide')} />
          <ListItem icone="lock" titre={t('aPropos.confidentialite')} onPress={() => ouvrir(URL_CONFIDENTIALITE)} />
          <ListItem icone="book" titre={t('aPropos.conditions')} onPress={() => ouvrir(URL_CONDITIONS)} />
          <ListItem icone="info" titre={t('aPropos.aide')} onPress={() => ouvrir(URL_AIDE)} />
          {urlStore ? <ListItem icone="heart" titre={t('aPropos.noter')} onPress={() => ouvrir(urlStore)} /> : null}
        </ListGroup>
      </ScrollView>

      <BottomSheet
        ouvert={source !== undefined}
        titre={source ? t(`aPropos.groupes.${source.cle}.titre`) : ''}
        onFermer={() => setDetail(null)}>
        {source?.details.map((d) => (
          <Text
            key={d}
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.corps, { color: couleurs.encre }]}>
            {t(`aPropos.${d}`)}
          </Text>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center' },
  enteteTexte: { flex: 1 },
});
