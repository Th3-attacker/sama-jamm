import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { envoyerCode, verifierCode } from '@/features/compte/compte';
import { appleDisponible, connecterApple, connecterGoogle, type IssueConnexion } from '@/features/compte/fournisseurs';
import { codePropre, detailConnexion, emailPropre, saisieCode } from '@/features/compte/validation';
import { journaliser } from '@/features/erreur/journal';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { Logo } from '@/ui/Logo';
import { TextField } from '@/ui/TextField';
import { EvitementClavier } from '@/ui/EvitementClavier';

/** Connexion par code reçu par e-mail (sans mot de passe). Le budget reste toujours sur le téléphone. */
export default function Connexion() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, nom } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [etape, setEtape] = useState<'email' | 'code'>('email');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const emailOk = emailPropre(email);
  const codeOk = codePropre(code);
  const [apple, setApple] = useState(false);

  useEffect(() => {
    let actif = true;
    appleDisponible()
      .then((oui) => {
        if (actif) setApple(oui);
      })
      .catch((e: unknown) => console.warn('Connexion Apple indisponible', e));
    return () => {
      actif = false;
    };
  }, []);

  const avecFournisseur = async (connecter: () => Promise<IssueConnexion>) => {
    if (envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      if ((await connecter()) === 'connecte') router.replace('/plus/compte');
    } catch (e: unknown) {
      console.warn('Connexion par fournisseur refusée', e);
      journaliser(e, 'ecran', new Date(), detailConnexion(e));
      setErreur(t('connexion.fournisseurImpossible'));
    } finally {
      setEnvoi(false);
    }
  };

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
      {/* Fermer en haut à gauche, puis la marque et le titre, comme sur la maquette. */}
      <View style={{ paddingTop: insets.top + espace.espace2, paddingHorizontal: espace.espace4 }}>
        <IconButton icone="close" label={t('commun.fermer')} onPress={() => router.back()} />
      </View>
      <EvitementClavier style={styles.ecran}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace5,
          }}>
          <Logo taille={56} />
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.grand}
            style={[typographie.titre1, { color: couleurs.emeraude, marginBottom: -espace.espace3 }]}>
            {t('compte.connexionTitre')}
          </Text>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {`${t('compte.connexionTexte')} ${t('connexion.budgetReste')}`}
          </Text>
          {etape === 'email' ? (
            <>
              {apple ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={
                    nom !== 'jour'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={rayon.rayonCarte}
                  style={styles.apple}
                  onPress={() => void avecFournisseur(connecterApple)}
                />
              ) : null}
              <Button variant="secondaire" pleineLargeur disabled={envoi} onPress={() => void avecFournisseur(connecterGoogle)}>
                {t('connexion.google')}
              </Button>
              <View accessibilityRole="none" style={[styles.separateur, { gap: espace.espace3 }]}>
                <View style={[styles.trait, { backgroundColor: couleurs.ligne }]} />
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                  {t('connexion.ou')}
                </Text>
                <View style={[styles.trait, { backgroundColor: couleurs.ligne }]} />
              </View>
              <TextField
                label={t('compte.email')}
                valeur={email}
                onChange={setEmail}
                placeholder="nom@exemple.com"
                aide={t('connexion.emailAide')}
                erreur={email !== '' && !emailOk ? t('connexion.emailInvalide') : undefined}
              />
              {erreur ? <Banner ton="erreur">{erreur}</Banner> : null}
              <Button variant="secondaire" pleineLargeur disabled={!emailOk || envoi} onPress={demander}>
                {t('connexion.recevoirCode')}
              </Button>
            </>
          ) : (
            <>
              <Banner ton="info">{t('connexion.codeEnvoye', { email: emailOk ?? email })}</Banner>
              <TextField
                label={t('connexion.code')}
                valeur={code}
                onChange={(v) => setCode(saisieCode(v))}
                clavier="number-pad"
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
        </ScrollView>
        {/* « Continuer sans compte » reste en bas de l'écran. */}
        <View style={{ paddingHorizontal: espace.espace5, paddingBottom: Math.max(insets.bottom, espace.espace4) }}>
          <Button variant="discret" pleineLargeur onPress={() => router.back()}>
            {t('connexion.sansCompte')}
          </Button>
        </View>
      </EvitementClavier>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  apple: { height: 48, width: '100%' },
  separateur: { flexDirection: 'row', alignItems: 'center' },
  trait: { flex: 1, height: StyleSheet.hairlineWidth },
});
