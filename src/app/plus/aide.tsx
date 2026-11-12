import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { EMAIL_CONTACT } from '@/constants/liens';
import { journalDesErreurs } from '@/features/erreur/journal';
import { journalEnTexte } from '@/lib/journalErreurs';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { TopBar } from '@/ui/TopBar';
import { useToast } from '@/ui/Toast';

import { espace } from '@/theme/tokens.generated';
const TYPES = ['horaires', 'arabe', 'bug', 'autre'] as const;
type TypeProbleme = (typeof TYPES)[number];

// Un lien mailto trop long n'est pas toujours accepté : le journal est coupé au-delà de cette taille.
const JOURNAL_MAX_MAIL = 1500;

/** Aide et contact : écrire à l'équipe (adresse à copier), signaler un problème (courriel prérempli). */
export default function Aide() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, latin } = useTheme();
  const { afficher } = useToast();
  const [type, setType] = useState<TypeProbleme | null>(null);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const copier = () => {
    if (!EMAIL_CONTACT) return;
    Clipboard.setStringAsync(EMAIL_CONTACT)
      .then(() => afficher({ texte: t('aide.copie'), icone: 'check' }))
      .catch((erreur: unknown) => console.warn('Copie impossible', erreur));
  };

  const envoyer = async () => {
    const sujet = t('aide.sujet', { type: t(`aide.types.${type ?? 'autre'}`) });
    const journal = journalDesErreurs();
    const detail = journal.length > 0 ? journalEnTexte(journal, t('aPropos.signalerEntete')) : t('aPropos.aucuneErreur');
    const corps = `${texte.trim()}\n\n---\n${detail.slice(0, JOURNAL_MAX_MAIL)}`;
    setEnvoi(true);
    try {
      const url = `mailto:${EMAIL_CONTACT ?? ''}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
      // Sans application de courriel (simulateur, téléphone sans compte), on propose la feuille de partage.
      if (EMAIL_CONTACT && (await Linking.canOpenURL(url))) await Linking.openURL(url);
      else await Share.share({ message: corps, title: sujet });
    } catch (erreur: unknown) {
      console.warn('Envoi impossible', erreur);
      afficher({ texte: t('aide.envoiImpossible'), icone: 'alert' });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('aide.titre')} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace5 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[latin.titre2, { color: couleurs.emeraude }]} accessibilityRole="header">
          {t('aide.titre')}
        </Text>

        {EMAIL_CONTACT ? (
          <View style={{ gap: espace.espace2 }}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.or }]}>
              {t('aide.ecrire')}
            </Text>
            <Text selectable maxFontSizeMultiplier={echelleMax.courant} style={[latin.titre3, { color: couleurs.encre }]}>
              {EMAIL_CONTACT}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('aide.delaiReponse')}
            </Text>
            <Button variant="discret" onPress={copier}>
              {t('aide.copier')}
            </Button>
          </View>
        ) : null}

        <View style={{ gap: espace.espace3 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.or }]}>
            {t('aide.signaler')}
          </Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('aide.typeProbleme')} style={[styles.puces, { gap: espace.espace2 }]}>
            {TYPES.map((id) => (
              <Chip key={id} compacte selectionne={type === id} onPress={() => setType(id)}>
                {t(`aide.types.${id}`)}
              </Chip>
            ))}
          </View>
          <TextInput
            accessibilityLabel={t('aide.descriptionLibelle')}
            value={texte}
            onChangeText={setTexte}
            multiline
            placeholder={t('aide.descriptionAide')}
            placeholderTextColor={couleurs.encre3}
            maxFontSizeMultiplier={echelleMax.courant}
            style={[
              typographie.corps,
              styles.zone,
              { borderRadius: rayon.rayonCarte, borderColor: couleurs.ligneForte, backgroundColor: couleurs.surface, color: couleurs.encre },
            ]}
          />
          <Button pleineLargeur disabled={texte.trim().length === 0 || envoi} onPress={envoyer}>
            {t('aide.envoyer')}
          </Button>
        </View>

        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.pied, { color: couleurs.encre3 }]}>
          {t('aide.pied')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
  zone: { minHeight: 120, borderWidth: 1, paddingHorizontal: 14, paddingVertical: espace.espace3, textAlignVertical: 'top' },
  pied: { textAlign: 'center' },
});
