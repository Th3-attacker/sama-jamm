import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { supprimerCompte } from '@/features/compte/compte';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Suppression du compte : ce qui est effacé des serveurs, ce qui reste sur le téléphone, confirmation. */
export default function SupprimerCompte() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const { afficher } = useToast();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(false);

  const supprimer = () => {
    Alert.alert(t('compte.supprimerTitre'), t('compte.supprimerTexte'), [
      { text: t('compte.supprimerGarder'), style: 'cancel' },
      {
        text: t('compte.supprimerConfirmer'),
        style: 'destructive',
        onPress: async () => {
          setEnvoi(true);
          setErreur(false);
          try {
            await supprimerCompte();
            afficher({ texte: t('compte.supprimeTexte'), icone: 'check' });
            router.dismissTo('/plus/reglages');
          } catch (e: unknown) {
            console.warn('Compte non supprimé', e);
            setErreur(true);
          } finally {
            setEnvoi(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('compte.supprimer')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <ListGroup titre={t('compte.effaceServeurs')}>
          <ListItem icone="user" titre={t('compte.effaceCompte')} />
          <ListItem icone="bookmark" titre={t('compte.effaceSynchro')} />
          <ListItem icone="users" titre={t('compte.effaceKhatm')} sousTitre={t('compte.effaceKhatmAide')} />
        </ListGroup>
        <ListGroup titre={t('compte.gardeTelephone')}>
          <ListItem icone="wallet" titre={t('compte.gardeBudget')} sousTitre={t('compte.gardeBudgetAide')} />
          <ListItem icone="download" titre={t('compte.gardeReste')} />
        </ListGroup>
        {erreur ? <Banner ton="erreur">{t('compte.supprimerHorsLigne')}</Banner> : null}
        <Button variant="danger" pleineLargeur disabled={envoi} onPress={supprimer}>
          {t('compte.supprimer')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
