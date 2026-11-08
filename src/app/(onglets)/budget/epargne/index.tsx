import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CarteObjectif } from '@/features/budget/CarteObjectif';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

/** Épargne avec intention : le total mis de côté, les objectifs et l'épargne libre. */
export default function EcranEpargne() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const etat = useBudget((depot, carnet) => depot.epargne(carnet));

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('epargne.titre')} etat={etat} />;
  }

  const { carnet, donnees: e } = etat;
  const devise = carnet.devise;
  const titreSection = (texte: string) => (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={echelleMax.courant}
      style={[typographie.titre3, { color: couleurs.encre }]}>
      {texte}
    </Text>
  );

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('epargne.titre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8 + marge,
          gap: espace.espace4,
        }}>
        <View
          accessible
          style={{
            padding: espace.espace4,
            gap: espace.espace1,
            borderRadius: rayon.rayonCarte,
            backgroundColor: couleurs.orDoux,
          }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.orTexte }]}>
            {t('epargne.misDeCote')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[typographie.chiffre, { color: couleurs.encre }]}>
            {formatMontant(e.total, devise)}
          </Text>
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.titre3, { color: couleurs.emeraude, marginTop: espace.espace2 }]}>
            {t('epargne.proverbe')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {t('epargne.sousTitre')}
          </Text>
        </View>

        {e.objectifs.length > 0 ? (
          e.objectifs.map((o) => <CarteObjectif key={o.id} objectif={o} devise={devise} />)
        ) : (
          <EmptyState icone="target" lang="fr" titre={t('epargne.aucunObjectif')} texte={t('epargne.vide')} />
        )}

        {e.libre > 0 ? (
          <ListGroup>
            <ListItem
              icone="wallet"
              titre={t('epargne.libre')}
              sousTitre={t('epargne.libreAide')}
              valeur={formatMontant(e.libre, devise)}
            />
          </ListGroup>
        ) : null}

        <Button icone="plus" pleineLargeur onPress={() => router.push('/budget/epargne/versement')}>
          {t('epargne.mettreDeCote')}
        </Button>
        <Button
          variant="secondaire"
          icone="target"
          pleineLargeur
          onPress={() => router.push('/budget/epargne/objectif')}>
          {t('epargne.nouvelObjectif')}
        </Button>

        {e.utilises.length > 0 ? (
          <>
            {titreSection(t('epargne.utilises'))}
            {e.utilises.map((o) => (
              <CarteObjectif key={o.id} objectif={o} devise={devise} />
            ))}
          </>
        ) : null}

        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {t('epargne.sansInteret')}
        </Text>
        <ListGroup>
          <ListItem
            icone="balance"
            titre={t('zakat.titre')}
            sousTitre={t('zakat.voir')}
            onPress={() => router.push('/budget/zakat')}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
