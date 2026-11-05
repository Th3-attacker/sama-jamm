import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { envoyerCode, verifierCode } from '@/features/compte/compte';
import { codePropre, emailPropre, LONGUEUR_CODE } from '@/features/compte/validation';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';

/** Connexion par code reçu par e-mail (sans mot de passe). Le budget reste toujours sur le téléphone. */
export default function Connexion() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [etape, setEtape] = useState<'email' | 'code'>('email');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const emailOk = emailPropre(email);
  const codeOk = codePropre(code);

  const demander = async () => {
    if (!emailOk || envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await envoyerCode(emailOk);
      setEtape('code');
    } catch (e: unknown) {
      console.warn('Code non envoyé', e);
      setErreur(t('connexion.envoiImpossible'));
    } finally {
      setEnvoi(false);
    }
  };

  const valider = async () => {
    if (!emailOk || !codeOk || envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await verifierCode(emailOk, codeOk);
      router.replace('/plus/compte');
    } catch (e: unknown) {
      console.warn('Code refusé', e);
      setErreur(t('connexion.codeRefuse'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('compte.connexionTitre')} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace5,
          }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {`${t('compte.connexionTexte')} ${t('connexion.budgetReste')}`}
          </Text>
          {etape === 'email' ? (
            <>
              <TextField
                label={t('compte.email')}
                valeur={email}
                onChange={setEmail}
                placeholder="nom@exemple.com"
                aide={t('connexion.emailAide')}
                erreur={email !== '' && !emailOk ? t('connexion.emailInvalide') : undefined}
              />
              {erreur ? <Banner ton="erreur">{erreur}</Banner> : null}
              <Button pleineLargeur disabled={!emailOk || envoi} onPress={demander}>
                {t('connexion.recevoirCode')}
              </Button>
            </>
          ) : (
            <>
              <Banner ton="info">{t('connexion.codeEnvoye', { email: emailOk ?? email })}</Banner>
              <TextField
                label={t('connexion.code')}
                valeur={code}
                onChange={setCode}
                clavier="number-pad"
                maxLength={LONGUEUR_CODE + 1}
                placeholder="123456"
              />
              {erreur ? <Banner ton="erreur">{erreur}</Banner> : null}
              <Button pleineLargeur disabled={!codeOk || envoi} onPress={valider}>
                {t('connexion.seConnecter')}
              </Button>
              <Button variant="discret" pleineLargeur onPress={() => setEtape('email')}>
                {t('connexion.changerEmail')}
              </Button>
            </>
          )}
          <Button variant="discret" pleineLargeur onPress={() => router.back()}>
            {t('connexion.sansCompte')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
