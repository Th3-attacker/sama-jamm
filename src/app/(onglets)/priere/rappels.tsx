import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { prieres, sons, useReglages, type NomPriere } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { RadioGroup } from '@/ui/RadioGroup';
import { Switch } from '@/ui/Switch';
import { TopBar } from '@/ui/TopBar';

const AVANCES = [5, 10, 15, 30] as const;

export default function AppelEtRappels() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const rappels = useReglages((s) => s.rappels);
  const sonsChoisis = useReglages((s) => s.sons);
  const rappelAvant = useReglages((s) => s.rappelAvant);
  const definirRappel = useReglages((s) => s.definirRappel);
  const definirSon = useReglages((s) => s.definirSon);
  const definirRappelAvant = useReglages((s) => s.definirRappelAvant);
  const [ouverte, setOuverte] = useState<NomPriere | null>(null);

  const resume = (p: NomPriere) => {
    const avant = rappelAvant[p];
    const son = t(`priere.sons.${sonsChoisis[p]}`);
    return avant ? `${son} · ${t('priere.rappelAvant', { minutes: avant })}` : son;
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('priere.rappelsTitre')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace5 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('priere.rappelsSousTitre')}
        </Text>
        {prieres.map((p) => {
          const nom = t(`priere.noms.${p}`);
          return (
            <ListGroup key={p} titre={`${nom} · ${t(`priere.nomsLocaux.${p}`)}`}>
              <ListItem
                icone="bell"
                titre={t('priere.notificationDe', { priere: nom })}
                droite={<Switch label={t('priere.notificationDe', { priere: nom })} active={rappels[p]} onChange={(actif) => definirRappel(p, actif)} />}
              />
              {rappels[p] ? <ListItem titre={t('priere.son')} sousTitre={resume(p)} onPress={() => setOuverte(p)} /> : null}
            </ListGroup>
          );
        })}
      </ScrollView>

      <BottomSheet ouvert={ouverte !== null} titre={ouverte ? t(`priere.noms.${ouverte}`) : ''} onFermer={() => setOuverte(null)}>
        {ouverte ? (
          <ScrollView contentContainerStyle={{ gap: espace.espace5 }}>
            <RadioGroup
              label={t('priere.son')}
              options={sons.map((s) => ({ id: s, label: t(`priere.sons.${s}`) }))}
              valeur={sonsChoisis[ouverte]}
              onChange={(id) => {
                const s = sons.find((x) => x === id);
                if (s) definirSon(ouverte, s);
              }}
            />
            <RadioGroup
              label={t('priere.rappelAvantTitre')}
              options={[
                { id: 'aucun', label: t('priere.sansRappel') },
                ...AVANCES.map((m) => ({ id: String(m), label: t('priere.rappelAvant', { minutes: m }) })),
              ]}
              valeur={rappelAvant[ouverte] ? String(rappelAvant[ouverte]) : 'aucun'}
              onChange={(id) => definirRappelAvant(ouverte, id === 'aucun' ? null : Number(id))}
            />
          </ScrollView>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
