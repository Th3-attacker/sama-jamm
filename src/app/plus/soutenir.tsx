import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { renvoyerEnAttente } from '@/features/dons/depot';
import { MONTANTS_SUGGERES, NUMERO_DONS, PAYS_DONS, TITULAIRE_DONS, WALLETS } from '@/features/dons/wallets';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Soutenir Sama Jàmm : un don envoyé depuis son propre wallet, puis une déclaration facultative. */
export default function Soutenir() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { afficher } = useToast();

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
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
          {t('dons.pourquoi')}
        </Text>
        <View style={{ gap: espace.espace2 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
            {t('dons.montantIdee')}
          </Text>
          <View style={[styles.montants, { gap: espace.espace2 }]}>
            {MONTANTS_SUGGERES.map((m) => (
              <View
                key={m}
                style={[styles.montant, { borderRadius: rayon.rayonCarte, backgroundColor: couleurs.orDoux }]}>
                <Text style={[typographie.titre3, { color: couleurs.orTexte }]}>{`${m} UM`}</Text>
              </View>
            ))}
          </View>
        </View>
        <ListGroup titre={t('dons.envoyerDepuis', { pays: PAYS_DONS })}>
          {WALLETS.map((w) => (
            <ListItem key={w.id} icone="wallet" titre={w.nom} valeur={NUMERO_DONS} />
          ))}
        </ListGroup>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {t('dons.auNomDe', { titulaire: TITULAIRE_DONS })}
        </Text>
        <Button variant="secondaire" icone="copy" pleineLargeur onPress={copier}>
          {t('dons.copierNumero')}
        </Button>
        <Button icone="heart" pleineLargeur onPress={() => router.push('/plus/don-declarer')}>
          {t('dons.jaiEnvoye')}
        </Button>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {t('dons.rienPreleve')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  montants: { flexDirection: 'row' },
  montant: { flex: 1, alignItems: 'center', paddingVertical: 14 },
});
