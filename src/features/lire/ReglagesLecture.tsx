// Feuille « Lecture » (bouton Aa du lecteur, maquette « Réglages de lecture ») : aperçu, taille,
// translittération (désactivée par défaut), chiffres arabes, récitateur par défaut. Aucune traduction : le Coran est en arabe seul.
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLecteur } from '@/features/ecouter/lecteur';
import { RECITATEURS, recitateur } from '@/features/ecouter/recitateurs';
import { useReglages } from '@/stores/reglages';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { Switch } from '@/ui/Switch';

import { ReglageTaille, useTaillesLecture } from './BarreTaille';

import { interlignes, tailles } from '@/theme/tokens.generated';
export function ReglagesLecture({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const { tailleArabe } = useTaillesLecture();
  const translit = useReglages((s) => s.translitLecture);
  const definirTranslit = useReglages((s) => s.definirTranslitLecture);
  const chiffres = useReglages((s) => s.chiffresArabes);
  const definirChiffres = useReglages((s) => s.definirChiffresArabes);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const actuel = recitateur(idRecitateur);
  const [recitateursOuverts, setRecitateursOuverts] = useState(false);

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
        {translit ? (
          <Text style={[typographie.translitteration, ligne(styles.translit), { color: couleurs.encre2 }]}>
            Inna maʿa l-ʿusri yusrā
          </Text>
        ) : null}
      </View>
      <ListGroup>
        <ReglageTaille />
      </ListGroup>
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
  translit: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
