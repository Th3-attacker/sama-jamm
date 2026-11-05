import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { EMAIL_CONTACT, URL_CONFIDENTIALITE, URL_STORE_ANDROID } from '@/constants/liens';
import { journalDesErreurs } from '@/features/erreur/journal';
import { journalEnTexte } from '@/lib/journalErreurs';
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
  { cle: 'recitations', details: ['sourceRecitations', 'sourceAdhan'] },
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
        <View style={[styles.entete, { gap: espace.espace2 }]}>
          <Logo taille={64} />
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[latin.titre2, styles.centre, { color: couleurs.emeraude }]}>
            {t('demarrage.signature')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.legende, styles.centre, { color: couleurs.encre3 }]}>
            {t('aPropos.version', { version })}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.corps, styles.centre, { color: couleurs.encre }]}>
            {t('aPropos.texte')}
          </Text>
        </View>

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
          {EMAIL_CONTACT ? (
            <ListItem icone="user" titre={t('aPropos.contact')} onPress={() => ouvrir(`mailto:${EMAIL_CONTACT}`)} />
          ) : null}
          <ListItem icone="lock" titre={t('aPropos.confidentialite')} onPress={() => ouvrir(URL_CONFIDENTIALITE)} />
          {Platform.OS === 'android' ? (
            <ListItem icone="heart" titre={t('aPropos.noter')} onPress={() => ouvrir(URL_STORE_ANDROID)} />
          ) : null}
          <ListItem
            icone="share"
            titre={t('aPropos.signaler')}
            sousTitre={t('aPropos.signalerAide')}
            onPress={() => {
              const journal = journalDesErreurs();
              const message =
                journal.length > 0
                  ? journalEnTexte(journal, t('aPropos.signalerEntete'))
                  : `${t('aPropos.signalerEntete')}\n${t('aPropos.aucuneErreur')}`;
              Share.share({ message }).catch((erreur: unknown) => console.warn('Partage impossible', erreur));
            }}
          />
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
  entete: { alignItems: 'center' },
  centre: { textAlign: 'center' },
});
