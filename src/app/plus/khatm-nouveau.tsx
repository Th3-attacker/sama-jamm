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
  const { couleurs, espace, typographie } = useTheme();
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
      <TopBar retour titre={t('khatm.nouveau')} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace5,
          }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
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
            <ListItem icone="share" titre={t('khatm.rejoindreLien')} sousTitre={t('khatm.rejoindreLienAide')} />
            <ListItem icone="bell" titre={t('khatm.rappelParticipants')} sousTitre={t('khatm.rappelParticipantsAide')} />
          </ListGroup>
          {erreur ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
          <Button icone="share" pleineLargeur disabled={!nomOk || !dateOk || envoi} onPress={creer}>
            {t('khatm.creer')}
          </Button>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
            {t('khatm.lienNote')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
