// Feuille « Lecture » (bouton Aa du lecteur, maquette « Réglages de lecture ») : aperçu, taille, affichage,
// translittération, chiffres arabes, récitateur par défaut.
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useLecteur } from '@/features/ecouter/lecteur';
import { RECITATEURS } from '@/features/ecouter/recitateurs';
import { affichagesLecture, useReglages } from '@/stores/reglages';
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
  const { couleurs, espace, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const affichage = useReglages((s) => s.affichage);
  const definirAffichage = useReglages((s) => s.definirAffichage);
  const translit = useReglages((s) => s.translitLecture);
  const definirTranslit = useReglages((s) => s.definirTranslitLecture);
  const chiffres = useReglages((s) => s.chiffresArabes);
  const definirChiffres = useReglages((s) => s.definirChiffresArabes);
  const idRecitateur = useLecteur((s) => s.recitateur);

  return (
    <BottomSheet ouvert={ouvert} titre={t('lire.reglagesLecture')} onFermer={onFermer}>
      {/* Aperçu : Ash-Sharh, verset 6. */}
      <View style={{ gap: espace.espace1 }}>
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
            {t('lire.apercuTraduction')}
          </Text>
        ) : null}
      </View>
      <ListGroup>
        <ReglageTaille />
      </ListGroup>
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
          sousTitre={t('reglages.translitAide')}
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
