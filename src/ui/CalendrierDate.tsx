import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { lireSaisieDate } from '@/features/budget/dettes';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Icon } from './Icon';

export type CalendrierDateProps = {
  label: string;
  /** Date « jj/mm/aaaa », ou chaîne vide si aucune date n'est choisie. */
  valeur: string;
  /** Reçoit « jj/mm/aaaa », ou une chaîne vide pour effacer la date. */
  onChange: (texte: string) => void;
  placeholder?: string;
  erreur?: string;
};

type Mois = { annee: number; mois: number };

const SEMAINE = 7;

/** « jj/mm/aaaa » issu d'une date. */
function versTexte(date: Date): string {
  const j = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${j}/${m}/${date.getFullYear()}`;
}

/** Champ de date : affiche la date choisie et ouvre un calendrier mensuel dans une feuille du bas. Semaine du lundi. */
export function CalendrierDate({ label, valeur, onChange, placeholder, erreur }: CalendrierDateProps) {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const langue = i18n.language;
  const [ouvert, setOuvert] = useState(false);

  // Date choisie (aaaa-mm-jj) ; le mois affiché suit la date choisie à l'ouverture.
  const jour = valeur.trim() === '' ? null : lireSaisieDate(valeur);
  const choisie = jour ? new Date(`${jour}T00:00:00`) : null;
  const [vue, setVue] = useState<Mois>(() => {
    const base = choisie ?? new Date();
    return { annee: base.getFullYear(), mois: base.getMonth() };
  });

  const aujourdhui = new Date();
  const formatLong = new Intl.DateTimeFormat(langue, { day: 'numeric', month: 'long', year: 'numeric' });
  const formatMois = new Intl.DateTimeFormat(langue, { month: 'long', year: 'numeric' });
  const formatJour = new Intl.DateTimeFormat(langue, { weekday: 'narrow' });

  // Lettres des jours : lundi 1er janvier 2024 = jour 0.
  const entetes = Array.from({ length: SEMAINE }, (_, k) => formatJour.format(new Date(2024, 0, 1 + k)));
  // Décalage du 1er du mois pour une semaine qui commence le lundi.
  const premier = new Date(vue.annee, vue.mois, 1);
  const decalage = (premier.getDay() + 6) % 7;
  const nombreJours = new Date(vue.annee, vue.mois + 1, 0).getDate();
  const cases: (number | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...Array.from({ length: nombreJours }, (_, k) => k + 1),
  ];
  while (cases.length % SEMAINE !== 0) cases.push(null);
  const lignes: (number | null)[][] = [];
  for (let k = 0; k < cases.length; k += SEMAINE) lignes.push(cases.slice(k, k + SEMAINE));

  const decaler = (pas: number) =>
    setVue((v) => {
      const d = new Date(v.annee, v.mois + pas, 1);
      return { annee: d.getFullYear(), mois: d.getMonth() };
    });

  const choisir = (numero: number) => {
    onChange(versTexte(new Date(vue.annee, vue.mois, numero)));
    setOuvert(false);
  };

  const estChoisi = (numero: number) =>
    choisie !== null &&
    choisie.getFullYear() === vue.annee &&
    choisie.getMonth() === vue.mois &&
    choisie.getDate() === numero;
  const estAujourdhui = (numero: number) =>
    aujourdhui.getFullYear() === vue.annee && aujourdhui.getMonth() === vue.mois && aujourdhui.getDate() === numero;

  const texteAffiche = choisie ? formatLong.format(choisie) : (placeholder ?? '');

  return (
    <View style={{ gap: espace.espace1 }}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${choisie ? formatLong.format(choisie) : t('commun.choisirDate')}`}
        accessibilityHint={erreur}
        onPress={() => setOuvert(true)}
        style={[
          styles.champ,
          {
            minHeight: cible.cibleAndroid,
            paddingHorizontal: espace.espace4,
            gap: espace.espace2,
            borderRadius: rayon.rayonCarte,
            backgroundColor: couleurs.surfaceCreux,
            borderColor: erreur ? couleurs.erreur : couleurs.ligneForte,
          },
        ]}>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.corps, styles.texte, { color: choisie ? couleurs.encre : couleurs.encre3 }]}>
          {texteAffiche}
        </Text>
        <Icon name="calendar" color={couleurs.encre2} size={20} />
      </Pressable>
      {erreur ? (
        <Text
          accessibilityLiveRegion="polite"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.legende, { color: couleurs.erreur }]}>
          {erreur}
        </Text>
      ) : null}

      <BottomSheet ouvert={ouvert} titre={t('commun.choisirDate')} onFermer={() => setOuvert(false)}>
        <View style={[styles.entete, { gap: espace.espace2 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commun.moisPrecedent')}
            onPress={() => decaler(-1)}
            hitSlop={8}
            style={[styles.fleche, { minHeight: cible.cibleAndroid, minWidth: cible.cibleAndroid }]}>
            <Icon name="arrow-left" color={couleurs.encre} size={20} />
          </Pressable>
          <Text
            accessibilityLiveRegion="polite"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.libelle, styles.mois, { color: couleurs.encre }]}>
            {formatMois.format(premier)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commun.moisSuivant')}
            onPress={() => decaler(1)}
            hitSlop={8}
            style={[styles.fleche, { minHeight: cible.cibleAndroid, minWidth: cible.cibleAndroid }]}>
            <Icon name="chevron-right" color={couleurs.encre} size={20} />
          </Pressable>
        </View>

        <View style={styles.ligne}>
          {entetes.map((lettre, k) => (
            <Text key={k} style={[typographie.legende, styles.cellule, { color: couleurs.encre3 }]}>
              {lettre}
            </Text>
          ))}
        </View>

        {lignes.map((ligne, i) => (
          <View key={i} style={styles.ligne}>
            {ligne.map((numero, k) => {
              if (numero === null) return <View key={k} style={styles.cellule} />;
              const choisi = estChoisi(numero);
              return (
                <Pressable
                  key={k}
                  accessibilityRole="button"
                  accessibilityLabel={formatLong.format(new Date(vue.annee, vue.mois, numero))}
                  accessibilityState={{ selected: choisi }}
                  onPress={() => choisir(numero)}
                  style={[
                    styles.cellule,
                    styles.jour,
                    {
                      minHeight: cible.cibleAndroid,
                      borderRadius: rayon.rayonCarte,
                      backgroundColor: choisi ? couleurs.emeraude : 'transparent',
                      borderWidth: estAujourdhui(numero) && !choisi ? 1 : 0,
                      borderColor: couleurs.emeraude,
                    },
                  ]}>
                  <Text
                    maxFontSizeMultiplier={echelleMax.courant}
                    style={[typographie.corps, { color: choisi ? couleurs.surEmeraude : couleurs.encre }]}>
                    {numero}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {choisie ? (
          <Button
            pleineLargeur
            onPress={() => {
              onChange('');
              setOuvert(false);
            }}>
            {t('commun.effacer')}
          </Button>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  champ: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  texte: { flex: 1, paddingVertical: 10 },
  entete: { flexDirection: 'row', alignItems: 'center' },
  fleche: { alignItems: 'center', justifyContent: 'center' },
  mois: { flex: 1, textAlign: 'center' },
  ligne: { flexDirection: 'row' },
  cellule: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  jour: { marginVertical: 2 },
});
