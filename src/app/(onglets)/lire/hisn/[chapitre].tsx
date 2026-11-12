import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarreCompteur } from '@/features/invocations/BarreCompteur';
import { CarteHisn } from '@/features/invocations/CarteHisn';
import { chapitreHisn, debutDe, titreDe, type ItemHisn } from '@/features/invocations/hisn';
import { useParametre } from '@/hooks/useParametre';
import { cleJour } from '@/lib/dates';
import { vibrerLeger } from '@/lib/haptique';
import { useLecture } from '@/stores/lecture';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { ProgressBar } from '@/ui/ProgressBar';
import { TopBar } from '@/ui/TopBar';

/** Un jour de lecture est compté après ce délai à l'écran, comme pour le Coran. */
const SECONDES_POUR_UN_JOUR = 30;

/** Un chapitre de la Citadelle du musulman : les invocations en arabe, avancée et compteur fixé en bas. */
export default function EcranChapitreHisn() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const brut = useParametre('chapitre');
  const chapitre = chapitreHisn(Number(brut));
  const marquerJour = useLecture((s) => s.marquerJour);
  const [comptes, setComptes] = useState<Record<number, number>>({});
  const [choisi, setChoisi] = useState<number | null>(null);

  useEffect(() => {
    const minuteur = setTimeout(() => marquerJour(cleJour(new Date())), SECONDES_POUR_UN_JOUR * 1000);
    return () => clearTimeout(minuteur);
  }, [marquerJour]);

  const items = useMemo(() => chapitre?.items ?? [], [chapitre]);
  const fait = (i: ItemHisn, c: Record<number, number> = comptes) => (c[i.id] ?? 0) >= i.repetitions;
  const actif = items.find((i) => i.id === choisi) ?? items.find((i) => !fait(i)) ?? items[0];
  const nbFaites = items.filter((i) => fait(i)).length;

  if (!chapitre) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('invocations.hisn')} />
        <View style={{ paddingHorizontal: espace.espace5 }}>
          <Banner ton="erreur" titre={t('etats.erreurTitre')}>
            {t('etats.erreurTexte')}
          </Banner>
        </View>
      </View>
    );
  }

  // Un toucher compte une lecture ; la dernière passe à l'invocation suivante, un toucher de plus recommence.
  const compter = () => {
    if (!actif) return;
    vibrerLeger();
    const avant = comptes[actif.id] ?? 0;
    const apres = avant >= actif.repetitions ? 0 : avant + 1;
    const suite = { ...comptes, [actif.id]: apres };
    setComptes(suite);
    if (apres >= actif.repetitions) {
      const prochaine = items.find((i) => i.id !== actif.id && !fait(i, suite));
      if (prochaine) setChoisi(prochaine.id);
    }
  };

  const titre = titreDe(chapitre, i18n.language);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('invocations.hisn')} sousTitre={t('invocations.hisnAide')} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace6, gap: espace.espace4 }}>
        <Text
          accessibilityRole="header"
          accessibilityLanguage={i18n.language === 'ar' ? 'ar' : undefined}
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.titre2, { color: couleurs.emeraude }]}>
          {titre}
        </Text>
        {items.length > 1 ? (
          <ProgressBar
            valeur={nbFaites / items.length}
            label={titre}
            detail={t('invocations.progression', { n: nbFaites, total: items.length })}
            ton="or"
          />
        ) : null}
        {items.map((it) => (
          <CarteHisn
            key={it.id}
            item={it}
            actif={it.id === actif?.id}
            termine={fait(it)}
            onChoisir={() => setChoisi(it.id)}
          />
        ))}
        <Banner ton="info">{t('invocations.noteHisn')}</Banner>
      </ScrollView>
      {actif ? (
        <BarreCompteur
          titre={debutDe(actif.texte)}
          arabe
          n={comptes[actif.id] ?? 0}
          total={actif.repetitions}
          onCompter={compter}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
