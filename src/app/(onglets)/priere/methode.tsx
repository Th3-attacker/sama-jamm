import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AJUSTEMENT_MAX, methodes, prieres, useReglages, type EcoleAsr, type Methode } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { RadioGroup } from '@/ui/RadioGroup';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';

const signe = (n: number) => (n > 0 ? `+${n} min` : `${n} min`);

export default function MethodeDeCalcul() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const methode = useReglages((s) => s.methode);
  const ecoleAsr = useReglages((s) => s.ecoleAsr);
  const ajustements = useReglages((s) => s.ajustements);
  const definirMethode = useReglages((s) => s.definirMethode);
  const definirEcoleAsr = useReglages((s) => s.definirEcoleAsr);
  const ajuster = useReglages((s) => s.ajuster);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('priere.methodeTitre')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace6 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('priere.methodeSousTitre')}
        </Text>

        <RadioGroup
          label={t('priere.methodeTitre')}
          options={methodes.map((m) => ({ id: m, label: t(`priere.methodes.${m}`) }))}
          valeur={methode}
          onChange={(id) => {
            const m = methodes.find((x): x is Methode => x === id);
            if (m) definirMethode(m);
          }}
        />

        <View style={{ gap: espace.espace2 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
            {t('priere.asr')}
          </Text>
          <SegmentedControl
            label={t('priere.asr')}
            options={[
              { id: 'standard', label: t('priere.asrStandard') },
              { id: 'hanafite', label: t('priere.asrHanafite') },
            ]}
            valeur={ecoleAsr}
            onChange={(id) => definirEcoleAsr(id === 'hanafite' ? 'hanafite' : ('standard' satisfies EcoleAsr))}
          />
        </View>

        <ListGroup titre={t('priere.ajuster')} note={t('priere.ajusterAide')}>
          {prieres.map((p) => {
            const nom = t(`priere.noms.${p}`);
            const valeur = ajustements[p];
            return (
              <ListItem
                key={p}
                titre={nom}
                valeur={signe(valeur)}
                droite={
                  <View style={styles.pas}>
                    <IconButton
                      icone="minus"
                      label={t('priere.retirerMinute', { priere: nom })}
                      disabled={valeur <= -AJUSTEMENT_MAX}
                      onPress={() => ajuster(p, -1)}
                    />
                    <IconButton
                      icone="plus"
                      label={t('priere.ajouterMinute', { priere: nom })}
                      disabled={valeur >= AJUSTEMENT_MAX}
                      onPress={() => ajuster(p, 1)}
                    />
                  </View>
                }
              />
            );
          })}
        </ListGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  pas: { flexDirection: 'row' },
});
