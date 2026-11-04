import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { journalDesErreurs } from '@/features/erreur/journal';
import { journalEnTexte } from '@/lib/journalErreurs';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** À propos : présentation, sources et licences des contenus, version de l'app. */
export default function APropos() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const version = Constants.expoConfig?.version;

  const paragraphe = [typographie.corps, { color: couleurs.encre }];
  const sources = ['sourceCoran', 'sourceTraduction', 'sourceAdhan', 'polices'] as const;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('aPropos.titre')} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace6 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={paragraphe}>
          {t('aPropos.texte')}
        </Text>

        <View style={{ gap: espace.espace3 }}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.libelle, { color: couleurs.encre2, paddingHorizontal: espace.espace1 }]}>
            {t('aPropos.sources')}
          </Text>
          <ListGroup>
            {sources.map((cle) => (
              <ListItem key={cle} titre={t(`aPropos.${cle}`)} />
            ))}
          </ListGroup>
        </View>

        <ListGroup>
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

        {version ? (
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.legende, { color: couleurs.encre3, textAlign: 'center' }]}>
            {t('reglages.version', { version })}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
