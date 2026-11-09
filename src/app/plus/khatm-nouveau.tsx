import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { lireSaisieDate, masqueDate } from '@/features/budget/dettes';
import { creerKhatm } from '@/features/khatm/depot';
import { inviter } from '@/features/khatm/partager';
import { supabase } from '@/services/supabase/client';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';

/** Nouveau khatm : nom, intention, date de fin ; puis l'invitation part par la feuille de partage. */
export default function NouveauKhatm() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, latin } = useTheme();
  const [nom, setNom] = useState(t('khatm.nomDefaut'));
  const [intention, setIntention] = useState('');
  const [echeance, setEcheance] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(false);

  const nomOk = nom.trim().length >= 1 && nom.trim().length <= 60;
  const jour = echeance.trim() === '' ? null : lireSaisieDate(echeance);
  const dateOk = echeance.trim() === '' || jour !== null;

  const creer = async () => {
    if (!nomOk || !dateOk || envoi) return;
    setEnvoi(true);
    setErreur(false);
    try {
      const id = await creerKhatm(nom.trim(), intention.trim() || null, jour);
      const { data } = await supabase.from('khatms').select('code').eq('id', id).single();
      const code: unknown = data?.code;
      if (typeof code === 'string') await inviter(nom.trim(), code);
      router.replace({ pathname: '/plus/khatm/[id]', params: { id } });
    } catch (e: unknown) {
      console.warn('Khatm non créé', e);
      setErreur(true);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : flèche et titre en 30/36 émeraude sur la même ligne. */}
      <TopBar
        retour
        gauche={
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, { color: couleurs.emeraude }]}>
            {t('khatm.nouveau')}
          </Text>
        }
      />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace4,
            gap: espace.espace4,
          }}>
          <Text accessibilityLanguage="wo" maxFontSizeMultiplier={echelleMax.courant} style={[latin.translitteration, styles.phrase, { color: couleurs.encre2 }]}>
            {t('khatm.nouveauTexte')}
          </Text>
          <TextField label={t('khatm.nom')} valeur={nom} onChange={setNom} maxLength={60} />
          <TextField
            label={t('khatm.intention')}
            valeur={intention}
            onChange={setIntention}
            maxLength={120}
            placeholder={t('khatm.intentionExemple')}
            aide={t('khatm.intentionAide')}
          />
          <TextField
            label={t('khatm.echeance')}
            valeur={echeance}
            onChange={(v) => setEcheance(masqueDate(v))}
            clavier="number-pad"
            placeholder="06/11/2026"
            aide={t('khatm.echeanceAide')}
            erreur={dateOk ? undefined : t('khatm.dateInvalide')}
          />
          <ListGroup titre={t('khatm.participants')}>
            <ListItem icone="users" titre={t('khatm.rejoindreLien')} sousTitre={t('khatm.rejoindreLienAide')} />
            <ListItem icone="bell" titre={t('khatm.rappelParticipants')} sousTitre={t('khatm.rappelParticipantsAide')} />
          </ListGroup>
          {erreur ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
          {/* Pied de page collé en bas quand le contenu est court. */}
          <View style={[styles.pied, { gap: espace.espace2 }]}>
            <Button icone="share" pleineLargeur disabled={!nomOk || !dateOk || envoi} onPress={creer}>
              {t('khatm.creer')}
            </Button>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.note, { color: couleurs.encre3 }]}>
              {t('khatm.lienNote')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  phrase: { fontSize: 16, lineHeight: 24 },
  pied: { marginTop: 'auto' },
  note: { textAlign: 'center', fontFamily: 'SourceSans3_400Regular' },
});
