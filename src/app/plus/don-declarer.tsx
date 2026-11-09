import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MESSAGE_MAX, montantDon, validerDeclaration, walletConnu } from '@/features/dons/declaration';
import { declarer } from '@/features/dons/depot';
import { PiedDon } from '@/features/dons/PiedDon';
import { WALLETS } from '@/features/dons/wallets';
import { useParametre } from '@/hooks/useParametre';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';

/** Déclaration facultative d'un don : wallet, montant, numéro de transaction ; jamais de téléphone ni de code. */
export default function DeclarerDon() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  // Wallet et montant choisis sur Soutenir, s'ils sont valables.
  const walletRecu = walletConnu(useParametre('wallet'));
  const montantRecu = montantDon(useParametre('montant'));
  const [wallet, setWallet] = useState<string>(walletRecu ?? WALLETS[0].id);
  const [montant, setMontant] = useState(montantRecu === null ? '' : String(montantRecu));
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const declaration = validerDeclaration({ wallet, montant, message });

  const envoyer = async () => {
    if (!declaration || envoi) return;
    setEnvoi(true);
    const { id } = await declarer(declaration);
    setEnvoi(false);
    router.replace({ pathname: '/plus/don-merci', params: { id } });
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour={t('dons.retourWallets')} titre={t('dons.declarerTitre')} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace6,
            gap: espace.espace5,
          }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {t('dons.declarerTexte')}
          </Text>
          <SegmentedControl
            label={t('dons.walletUtilise')}
            options={WALLETS.map((w) => ({ id: w.id, label: w.nom }))}
            valeur={wallet}
            onChange={setWallet}
          />
          <TextField
            label={t('dons.montantEnvoye')}
            valeur={montant}
            onChange={setMontant}
            clavier="number-pad"
            suffixe="UM"
            erreur={montant !== '' && montantDon(montant) === null ? t('budget.montantInvalide') : undefined}
          />
          <TextField
            label={t('dons.message')}
            valeur={message}
            onChange={setMessage}
            placeholder={t('dons.messagePlaceholder')}
            maxLength={MESSAGE_MAX}
          />
        </ScrollView>
        <PiedDon note={t('dons.pasDeCode')}>
          <Button pleineLargeur disabled={!declaration || envoi} onPress={envoyer}>
            {t('dons.envoyer')}
          </Button>
        </PiedDon>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
