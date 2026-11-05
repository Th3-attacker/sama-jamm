import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { estCategorie, invocationsDe, type Invocation } from '@/features/invocations/donnees';
import { useTaillesLecture } from '@/features/lire/BarreTaille';
import { sourate, traductionDe, translitDe, versetsDe } from '@/features/lire/coran';
import { marqueur } from '@/features/lire/PageMushaf';
import { TranslitVerset } from '@/features/lire/TranslitVerset';
import { useParametre } from '@/hooks/useParametre';
import { cleJour } from '@/lib/dates';
import { vibrerLeger } from '@/lib/haptique';
import { useLecture } from '@/stores/lecture';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Icon } from '@/ui/Icon';
import { TopBar } from '@/ui/TopBar';

/** Un jour de lecture est compté après ce délai à l'écran, comme pour le Coran. */
const SECONDES_POUR_UN_JOUR = 30;

/** Invocations d'un moment de la journée : arabe, translittération, traduction, compteur de lectures. */
export default function EcranInvocations() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const brut = useParametre('categorie');
  const marquerJour = useLecture((s) => s.marquerJour);

  useEffect(() => {
    const minuteur = setTimeout(() => marquerJour(cleJour(new Date())), SECONDES_POUR_UN_JOUR * 1000);
    return () => clearTimeout(minuteur);
  }, [marquerJour]);

  if (!estCategorie(brut)) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('lire.invocations')} />
        <View style={{ paddingHorizontal: espace.espace5 }}>
          <Banner ton="erreur" titre={t('etats.erreurTitre')}>
            {t('etats.erreurTexte')}
          </Banner>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t(`invocations.${brut}`)} sousTitre={t('lire.invocations')} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace4 }}>
        {invocationsDe(brut).map((inv) => (
          <CarteInvocation key={inv.id} invocation={inv} />
        ))}
        <Banner ton="info">{t('invocations.note')}</Banner>
      </ScrollView>
    </View>
  );
}

function CarteInvocation({ invocation: inv }: { invocation: Invocation }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const affichage = useReglages((s) => s.affichage);
  const translitActive = useReglages((s) => s.translitLecture);
  const [compte, setCompte] = useState(0);
  const meta = sourate(inv.sourate);

  const versets = useMemo(() => {
    const arabes = versetsDe(inv.sourate);
    const trads = traductionDe(inv.sourate);
    const translits = translitDe(inv.sourate);
    return Array.from({ length: inv.a - inv.de + 1 }, (_, k) => {
      const n = inv.de + k;
      return { n, arabe: arabes[n - 1] ?? '', trad: trads[n - 1] ?? '', translit: translits[n - 1] ?? '' };
    });
  }, [inv]);

  const reference = `${meta?.nom ?? ''} · ${inv.sourate}:${inv.de}${inv.a > inv.de ? `-${inv.a}` : ''}`;
  const termine = inv.repetitions > 1 && compte >= inv.repetitions;

  return (
    <View
      style={{
        backgroundColor: couleurs.surface,
        borderColor: couleurs.ligne,
        borderWidth: 1,
        borderRadius: rayon.rayonCarte,
        padding: espace.espace4,
        gap: espace.espace3,
      }}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.orTexte }]}>
        {reference}
      </Text>
      {affichage !== 'tradSeule' ? (
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.coran, tailleArabe, styles.arabe, { color: couleurs.encre }]}>
          {versets.map((v) => `${v.arabe} ${marqueur(v.n)}`).join(' ')}
        </Text>
      ) : null}
      {affichage !== 'tradSeule' && translitActive
        ? versets.map((v) => (v.translit ? <TranslitVerset key={v.n} texte={v.translit} taille={tailleTrad} /> : null))
        : null}
      {affichage !== 'arabeSeul' ? (
        <Text
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.lecture, tailleTrad, { color: couleurs.encre2 }]}>
          {versets.map((v) => v.trad).join(' ')}
        </Text>
      ) : null}
      {inv.repetitions > 1 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('invocations.compteur', { n: compte, total: inv.repetitions })}. ${t('invocations.compteurAide')}`}
          onPress={() => {
            vibrerLeger();
            setCompte((c) => (c >= inv.repetitions ? 0 : c + 1));
          }}
          style={[
            styles.compteur,
            {
              borderRadius: rayon.rayonPastille,
              borderColor: termine ? couleurs.emeraude : couleurs.ligneForte,
              backgroundColor: termine ? couleurs.emeraudeDoux : 'transparent',
              gap: espace.espace2,
            },
          ]}>
          {termine ? <Icon name="check-circle" size={20} color={couleurs.emeraude} /> : null}
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.libelle, { color: termine ? couleurs.emeraude : couleurs.encre }]}>
            {termine ? t('invocations.terminee') : t('invocations.compteur', { n: compte, total: inv.repetitions })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
  compteur: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
