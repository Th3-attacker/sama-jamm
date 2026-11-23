// Contenu de la feuille « Écoute » du lecteur, sur le modèle de la feuille « Lecture » : lignes groupées avec la valeur
// à droite, minuterie, répétition, vitesse, récitateur et taille du texte. Partagé entre la feuille maison (Android) et
// l'écran en feuille native (iOS).
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { ReglageTaille } from '@/features/lire/BarreTaille';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Slider } from '@/ui/Slider';

import { changerRecitateur, definirMinuterie, definirRepetitionVerset, definirRepeterSourate, definirVitesse, useLecteur, VITESSES } from './lecteur';
import { DUREES_MINUTERIE, formatReste, minuterieDans, REPETITIONS_VERSET, resteMinuterie } from './minuterie';
import { RECITATEURS, recitateur } from './recitateurs';

import { interlignes, tailles } from '@/theme/tokens.generated';

type Repetition = 'non' | 'verset' | 'sourate';
type Ouverte = 'minuterie' | 'repeter' | 'recitateur' | null;

/** `onArreter` : « Arrêter la lecture » ; l'écran qui contient la feuille la ferme et quitte le lecteur. */
export function ContenuEcoute({ onArreter, verre = false }: { onArreter: () => void; verre?: boolean }) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, ligne } = useTheme();
  const minuterie = useLecteur((s) => s.minuterie);
  const repetitionVerset = useLecteur((s) => s.repetitionVerset);
  const repeterSourate = useLecteur((s) => s.repeterSourate);
  const vitesse = useLecteur((s) => s.vitesse);
  const page = useLecteur((s) => s.page);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const [ouverte, setOuverte] = useState<Ouverte>(null);
  // Durée choisie, pour la surligner pendant que le temps restant s'écoule.
  const [dureeChoisie, setDureeChoisie] = useState<number | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    if (minuterie.type !== 'duree') return;
    const tic = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(tic);
  }, [minuterie]);
  const reste = resteMinuterie(minuterie, maintenant);

  const repetition: Repetition = repeterSourate ? 'sourate' : repetitionVerset === 1 ? 'non' : 'verset';
  const choisirRepetition = (r: Repetition) => {
    if (r === 'non') {
      definirRepetitionVerset(1);
      definirRepeterSourate(false);
    } else if (r === 'verset') {
      definirRepeterSourate(false);
      if (repetitionVerset === 1) definirRepetitionVerset(3);
    } else {
      definirRepetitionVerset(1);
      definirRepeterSourate(true);
    }
  };
  const basculer = (cle: Exclude<Ouverte, null>) => setOuverte((o) => (o === cle ? null : cle));

  const valeurMinuterie =
    reste !== null
      ? t('ecouter.minuterieArret', { duree: formatReste(reste) })
      : minuterie.type === 'finSourate'
        ? t('ecouter.minuterieFinSourate')
        : t('ecouter.minuterieOff');
  const valeurRepeter =
    repetition === 'sourate'
      ? t('ecouter.repeterSourate')
      : repetition === 'verset'
        ? repetitionVerset === 0
          ? t('ecouter.sansFin')
          : t('ecouter.fois', { count: repetitionVerset })
        : t('ecouter.repetitionNon');

  return (
    <>
      <ListGroup>
        <ListItem icone="moon" titre={t('ecouter.minuterie')} valeur={valeurMinuterie} fin="chevron" onPress={() => basculer('minuterie')} />
        <ListItem icone="reset" titre={t('ecouter.repeter')} valeur={valeurRepeter} fin="chevron" onPress={() => basculer('repeter')} />
      </ListGroup>

      {ouverte === 'minuterie' ? (
        <View style={{ gap: espace.espace3 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('ecouter.arreterLaLecture')}
          </Text>
          <View style={[styles.puces, { gap: espace.espace2 }]}>
            <Chip
              selectionne={minuterie.type === 'aucune'}
              onPress={() => {
                setDureeChoisie(null);
                definirMinuterie({ type: 'aucune' });
              }}>
              {t('ecouter.minuterieOff')}
            </Chip>
            {DUREES_MINUTERIE.map((m) => (
              <Chip
                key={m}
                selectionne={minuterie.type === 'duree' && dureeChoisie === m}
                onPress={() => {
                  setDureeChoisie(m);
                  definirMinuterie(minuterieDans(m, Date.now()));
                }}>
                {t('ecouter.minutes', { count: m })}
              </Chip>
            ))}
            <Chip
              selectionne={minuterie.type === 'finSourate'}
              onPress={() => {
                setDureeChoisie(null);
                definirMinuterie({ type: 'finSourate' });
              }}>
              {t('ecouter.minuterieFinSourate')}
            </Chip>
          </View>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.resume), { color: couleurs.encre3 }]}>
            {reste !== null
              ? t('ecouter.minuterieArret', { duree: formatReste(reste) })
              : minuterie.type === 'finSourate'
                ? t('ecouter.minuterieResumeFinSourate')
                : t('ecouter.minuterieResumeAucune')}
          </Text>
        </View>
      ) : null}

      {ouverte === 'repeter' ? (
        <View style={{ gap: espace.espace3 }}>
          <SegmentedControl
            label={t('ecouter.repeter')}
            options={[
              { id: 'non', label: t('ecouter.repetitionNon') },
              { id: 'verset', label: t('ecouter.repeterVerset') },
              ...(page === null ? [{ id: 'sourate', label: t('ecouter.repeterSourate') }] : []),
            ]}
            valeur={repetition}
            onChange={(id) => {
              if (id === 'non' || id === 'verset' || id === 'sourate') choisirRepetition(id);
            }}
          />
          {repetition === 'verset' ? (
            <View style={[styles.puces, { gap: espace.espace2 }]}>
              {REPETITIONS_VERSET.filter((n) => n !== 1).map((n) => (
                <Chip key={n} selectionne={repetitionVerset === n} onPress={() => definirRepetitionVerset(n)}>
                  {n === 0 ? t('ecouter.sansFin') : t('ecouter.fois', { count: n })}
                </Chip>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Slider
        label={t('ecouter.vitesse')}
        min={VITESSES[0]}
        max={VITESSES[VITESSES.length - 1] ?? 1.5}
        pas={0.25}
        valeur={vitesse}
        onChange={definirVitesse}
        format={(v) => `${String(v).replace('.', ',')} ×`}
      />

      <ListGroup>
        <ReglageTaille verre={verre} />
      </ListGroup>

      <ListGroup>
        <ListItem
          icone="headphones"
          titre={t('ecouter.recitateur')}
          valeur={recitateur(idRecitateur)?.nom}
          fin="chevron"
          onPress={() => basculer('recitateur')}
        />
      </ListGroup>
      {ouverte === 'recitateur' ? (
        <ListGroup>
          {RECITATEURS.map((r) => (
            <ListItem key={r.id} titre={r.nom} fin={r.id === idRecitateur ? 'coche' : undefined} onPress={() => changerRecitateur(r.id)} />
          ))}
        </ListGroup>
      ) : null}

      <Button variant="discret" pleineLargeur onPress={onArreter}>
        {t('ecouter.arreter')}
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
  resume: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
