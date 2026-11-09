import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDons } from '@/features/dons/depot';
import { WALLETS } from '@/features/dons/wallets';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/ui/Badge';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** Merci : « Sant Yàlla », la déclaration et son statut (en attente de vérification). */
export default function MerciDon() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const id = useParametre('id');
  const d = useDons((s) => s.declarations.find((x) => x.id === id));
  const insets = useSafeAreaInsets();
  const accueil = () => router.replace('/accueil');

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        transparent
        gauche={<IconButton icone="close" taille={22} couleur={couleurs.encre} label={t('commun.fermer')} onPress={accueil} />}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace6,
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
              valeur={`${d.montant} UM`}
            />
            <ListItem icone="clock" titre={t('dons.statut')} droite={<Badge ton="alerte">{t('dons.statuts.en_attente')}</Badge>} />
          </ListGroup>
        ) : null}
        {d && !d.envoyee ? <Banner ton="attention">{t('dons.envoiDiffere')}</Banner> : null}
      </ScrollView>
      <View style={{ paddingHorizontal: espace.espace5, paddingTop: espace.espace3, paddingBottom: Math.max(insets.bottom, espace.espace4) }}>
        <Button variant="secondaire" pleineLargeur onPress={accueil}>
          {t('dons.revenirAccueil')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
