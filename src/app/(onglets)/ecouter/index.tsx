import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMenuPlus } from '@/features/plus/MenuPlus';
import { ecouter, useLecteur } from '@/features/ecouter/lecteur';
import { RECITATEURS, recitateur } from '@/features/ecouter/recitateurs';
import { sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** Onglet Écouter : reprendre l'écoute en cours, puis choisir un récitateur. */
export default function Ecouter() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const menu = useMenuPlus();
  const derniere = useLecteur((s) => s.derniere);
  const idRecitateur = useLecteur((s) => s.recitateur);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar titre={t('ecouter.titre')} actions={[menu.action]} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace5 }}>
        {derniere ? (
          <ListGroup titre={t('ecouter.reprendre')}>
            <ListItem
              icone="play"
              titre={`${sourate(derniere.sourate)?.nom ?? ''} · ${t('ecouter.versetN', { n: derniere.verset })}`}
              sousTitre={recitateur(idRecitateur)?.nom}
              onPress={() => {
                ecouter(derniere);
                router.push('/ecouter/lecteur');
              }}
            />
          </ListGroup>
        ) : null}
        <ListGroup titre={t('ecouter.recitateurs')}>
          {RECITATEURS.map((r) => (
            <ListItem
              key={r.id}
              icone="headphones"
              titre={r.nom}
              sousTitre={t('ecouter.murattal')}
              fin={r.id === idRecitateur ? 'coche' : 'chevron'}
              onPress={() => router.push({ pathname: '/ecouter/[recitateur]', params: { recitateur: r.id } })}
            />
          ))}
        </ListGroup>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {t('ecouter.reseau')}
        </Text>
      </ScrollView>
      {menu.feuille}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
