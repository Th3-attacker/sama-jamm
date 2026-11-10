// Feuille « Lecture » (bouton Aa du lecteur, maquette « Réglages de lecture ») : aperçu, taille, affichage,
// translittération, chiffres arabes, récitateur par défaut.
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLecteur } from '@/features/ecouter/lecteur';
import { RECITATEURS, recitateur } from '@/features/ecouter/recitateurs';
import { affichagesLecture, useReglages } from '@/stores/reglages';
import type { Langue } from '@/i18n/langues';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Switch } from '@/ui/Switch';

import { ReglageTaille, useTaillesLecture } from './BarreTaille';

export function ReglagesLecture({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe } = useTaillesLecture();
  const affichage = useReglages((s) => s.affichage);
  const definirAffichage = useReglages((s) => s.definirAffichage);
  const translit = useReglages((s) => s.translitLecture);
  const definirTranslit = useReglages((s) => s.definirTranslitLecture);
  const chiffres = useReglages((s) => s.chiffresArabes);
  const definirChiffres = useReglages((s) => s.definirChiffresArabes);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const actuel = recitateur(idRecitateur);
  const [recitateursOuverts, setRecitateursOuverts] = useState(false);
  const traduction = useReglages((s) => s.traduction);
  const definirTraduction = useReglages((s) => s.definirTraduction);
  // « Aucune » = arabe seul ; sinon la traduction choisie.
  const choixTraduction = affichage === 'arabeSeul' ? 'aucune' : traduction;

  return (
    <BottomSheet ouvert={ouvert} titre={t('lire.reglagesLecture')} onFermer={onFermer}>
      {/* Aperçu : Ash-Sharh, verset 6 ; carte de 16 de rayon, texte arabe à droite. */}
      <View
        style={{
          gap: espace.espace1,
          paddingVertical: espace.espace3,
          paddingHorizontal: espace.espace4,
          backgroundColor: couleurs.surface,
          borderColor: couleurs.ligne,
          borderWidth: 1,
          borderRadius: rayon.rayonCarte + espace.espace1,
        }}>
        <Text
          accessibilityLanguage="ar"
          style={[typographie.coran, tailleArabe, { color: couleurs.encre, textAlign: 'right', writingDirection: 'rtl' }]}>
          {`إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ${chiffres ? '﴿٦﴾' : '﴿6﴾'}`}
        </Text>
        {translit && affichage !== 'tradSeule' ? (
          <Text style={[typographie.translitteration, styles.translit, { color: couleurs.encre2 }]}>
            Inna maʿa l-ʿusri yusrā
          </Text>
        ) : null}
        {affichage !== 'arabeSeul' ? (
          <Text style={[typographie.lecture, styles.traduction, { color: couleurs.encre }]}>
            {`${t('lire.apercuTraduction')} (94:6)`}
          </Text>
        ) : null}
      </View>
      <ListGroup>
        <ReglageTaille />
      </ListGroup>
      <SegmentedControl
        label={t('reglages.traduction')}
        options={[
          { id: 'fr', label: 'Français' },
          { id: 'aucune', label: t('reglages.traductionAucune') },
        ]}
        valeur={choixTraduction}
        onChange={(id) => {
          if (id === 'aucune') {
            definirAffichage('arabeSeul');
            return;
          }
          if (id === 'fr') {
            definirTraduction(id satisfies Langue);
            if (affichage === 'arabeSeul') definirAffichage('arabeTrad');
          }
        }}
      />
      <SegmentedControl
        label={t('lire.affichage')}
        options={[
          { id: 'arabeSeul', label: t('lire.arabeSeul') },
          { id: 'arabeTrad', label: t('lire.arabeTrad') },
          { id: 'tradSeule', label: t('lire.tradSeule') },
        ]}
        valeur={affichage}
        onChange={(id) => {
          const choix = affichagesLecture.find((x) => x === id);
          if (choix) definirAffichage(choix);
        }}
      />
      <ListGroup>
        <ListItem
          titre={t('reglages.translit')}
          sousTitre={t('reglages.translitAideCourte')}
          droite={<Switch label={t('reglages.translit')} active={translit} onChange={definirTranslit} />}
        />
        <ListItem
          titre={t('lire.chiffresArabes')}
          sousTitre={t('lire.chiffresArabesAide')}
          droite={<Switch label={t('lire.chiffresArabes')} active={chiffres} onChange={definirChiffres} />}
        />
        <ListItem
          icone="headphones"
          titre={t('lire.recitateurDefaut')}
          valeur={actuel?.nom}
          fin="chevron"
          onPress={() => setRecitateursOuverts((o) => !o)}
        />
      </ListGroup>
      {recitateursOuverts ? (
        <ListGroup>
          {RECITATEURS.map((r) => (
            <ListItem
              key={r.id}
              titre={r.nom}
              fin={r.id === idRecitateur ? 'coche' : undefined}
              onPress={() => useLecteur.setState({ recitateur: r.id })}
            />
          ))}
        </ListGroup>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  translit: { fontSize: 14, lineHeight: 20 },
  traduction: { fontSize: 16, lineHeight: 24 },
});
