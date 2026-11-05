import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CarteWallet } from '@/features/dons/CarteWallet';
import { renvoyerEnAttente } from '@/features/dons/depot';
import { PiedDon } from '@/features/dons/PiedDon';
import {
  MONTANTS_SUGGERES,
  NUMERO_DONS,
  PAYS_DONS,
  TITULAIRE_DONS,
  WALLETS,
  type IdWallet,
} from '@/features/dons/wallets';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Soutenir Sama Jàmm : un montant, un wallet, l'envoi depuis son propre wallet, puis une déclaration facultative. */
export default function Soutenir() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  // 200 UM proposé par défaut, comme la maquette ; « autre » laisse le montant à saisir.
  const [montant, setMontant] = useState<number | 'autre'>(MONTANTS_SUGGERES[1]);
  const [wallet, setWallet] = useState<IdWallet>(WALLETS[0].id);

  useEffect(() => {
    void renvoyerEnAttente();
  }, []);

  const copier = () => {
    Clipboard.setStringAsync(NUMERO_DONS)
      .then(() => afficher({ texte: t('dons.numeroCopie'), icone: 'check' }))
      .catch((e: unknown) => console.warn('Numéro non copié', e));
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('dons.titre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace6,
          gap: espace.espace5,
        }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('dons.pourquoi')}
        </Text>
        <View style={{ gap: espace.espace2 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
            {t('dons.montantIdee')}
          </Text>
          <View style={[styles.puces, { gap: espace.espace2 }]}>
            {MONTANTS_SUGGERES.map((m) => (
              <Chip key={m} selectionne={montant === m} onPress={() => setMontant(m)}>
                {`${m} UM`}
              </Chip>
            ))}
            <Chip selectionne={montant === 'autre'} onPress={() => setMontant('autre')}>
              {t('dons.autreMontant')}
            </Chip>
          </View>
        </View>
        <View style={{ gap: espace.espace2 }} accessibilityRole="radiogroup">
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
            {t('dons.envoyerDepuis', { pays: PAYS_DONS })}
          </Text>
          {WALLETS.map((w) => (
            <CarteWallet
              key={w.id}
              nom={w.nom}
              pays={t('dons.paysDevise', { pays: PAYS_DONS })}
              numero={NUMERO_DONS}
              titulaire={TITULAIRE_DONS}
              choisi={wallet === w.id}
              onChoisir={() => setWallet(w.id)}
              onCopier={copier}
            />
          ))}
        </View>
      </ScrollView>
      <PiedDon note={t('dons.rienPreleve')}>
        <Button
          icone="heart"
          pleineLargeur
          onPress={() =>
            router.push({
              pathname: '/plus/don-declarer',
              params: { wallet, montant: montant === 'autre' ? '' : String(montant) },
            })
          }>
          {t('dons.jaiEnvoye')}
        </Button>
      </PiedDon>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
});
