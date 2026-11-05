// Feuille « Lecture » (bouton Aa du lecteur, maquette « Réglages de lecture ») : aperçu, taille, affichage,
// translittération, chiffres arabes, récitateur par défaut.
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useLecteur } from '@/features/ecouter/lecteur';
import { RECITATEURS } from '@/features/ecouter/recitateurs';
import { affichagesLecture, useReglages } from '@/stores/reglages';
import type { Langue } from '@/i18n/langues';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { Chip } from '@/ui/Chip';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Switch } from '@/ui/Switch';

import { ReglageTaille, useTaillesLecture } from './BarreTaille';

export function ReglagesLecture({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const affichage = useReglages((s) => s.affichage);
  const definirAffichage = useReglages((s) => s.definirAffichage);
  const translit = useReglages((s) => s.translitLecture);
  const definirTranslit = useReglages((s) => s.definirTranslitLecture);
  const chiffres = useReglages((s) => s.chiffresArabes);
  const definirChiffres = useReglages((s) => s.definirChiffresArabes);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const traduction = useReglages((s) => s.traduction);
  const definirTraduction = useReglages((s) => s.definirTraduction);
  // « Aucune » = arabe seul ; sinon la traduction choisie.
  const choixTraduction = affichage === 'arabeSeul' ? 'aucune' : traduction;

  return (
    <BottomSheet ouvert={ouvert} titre={t('lire.reglagesLecture')} onFermer={onFermer}>
      {/* Aperçu : Ash-Sharh, verset 6. */}
      <View
        style={{
          gap: espace.espace1,
          padding: espace.espace4,
          backgroundColor: couleurs.surface,
          borderColor: couleurs.ligne,
          borderWidth: 1,
          borderRadius: rayon.rayonCarte,
        }}>
        <Text
          accessibilityLanguage="ar"
          style={[typographie.coran, tailleArabe, { color: couleurs.encre, textAlign: 'center' }]}>
          {`إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ${chiffres ? '٦' : '6'}`}
        </Text>
        {translit ? (
          <Text style={[typographie.translitteration, tailleTrad, { color: couleurs.encre2, textAlign: 'center' }]}>
            Inna maʿa l-ʿusri yusrā
          </Text>
        ) : null}
        {affichage !== 'arabeSeul' ? (
          <Text style={[typographie.lecture, tailleTrad, { color: couleurs.encre2, textAlign: 'center' }]}>
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
          { id: 'wo', label: 'Wolof' },
          { id: 'aucune', label: t('reglages.traductionAucune') },
        ]}
        valeur={choixTraduction}
        onChange={(id) => {
          if (id === 'aucune') {
            definirAffichage('arabeSeul');
            return;
          }
          if (id === 'fr' || id === 'wo') {
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
      </ListGroup>
      <View style={{ gap: espace.espace2 }}>
        <Text style={[typographie.libelle, { color: couleurs.encre }]}>{t('lire.recitateurDefaut')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espace.espace2 }}>
          {RECITATEURS.map((r) => (
            <Chip
              key={r.id}
              selectionne={r.id === idRecitateur}
              onPress={() => useLecteur.setState({ recitateur: r.id })}>
              {r.nom}
            </Chip>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}
