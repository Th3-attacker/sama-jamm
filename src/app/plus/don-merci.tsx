import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useDons } from '@/features/dons/depot';
import { WALLETS } from '@/features/dons/wallets';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** Merci : « Sant Yàlla », la déclaration et son statut (en attente de vérification). */
export default function MerciDon() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const id = useParametre('id');
  const d = useDons((s) => s.declarations.find((x) => x.id === id));

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar titre={t('dons.merciTitre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <EmptyState
          icone="heart"
          titre={t('formules.gratitude')}
          sousTitre={t('formules.gratitudeTrad')}
          texte={t('dons.merci')}
        />
        {d ? (
          <ListGroup titre={t('dons.votreDeclaration')} note={t('dons.verificationNote')}>
            <ListItem
              icone="wallet"
              titre={WALLETS.find((w) => w.id === d.wallet)?.nom ?? d.wallet}
              sousTitre={`${t('dons.reference')} ${d.reference}`}
              valeur={`${d.montant} UM`}
            />
            <ListItem titre={t('dons.statut')} valeur={t('dons.statuts.en_attente')} />
          </ListGroup>
        ) : null}
        {d && !d.envoyee ? <Banner ton="attention">{t('dons.envoiDiffere')}</Banner> : null}
        <Button pleineLargeur onPress={() => router.replace('/accueil')}>
          {t('dons.revenirAccueil')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
