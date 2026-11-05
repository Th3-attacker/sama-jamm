import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/compte/compte';
import {
  marquerJuzLu,
  prendreJuz,
  programmerRappelKhatm,
  quitterKhatm,
  rendreJuz,
  useKhatm,
} from '@/features/khatm/depot';
import { resumeKhatm, vuePart, type VuePart } from '@/features/khatm/logique';
import { inviter } from '@/features/khatm/partager';
import { reperes } from '@/features/lire/coran';
import { useParametre } from '@/hooks/useParametre';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ProgressBar } from '@/ui/ProgressBar';
import { TopBar } from '@/ui/TopBar';

/** Un khatm collectif : les 30 juz en direct, mon juz, inviter. */
export default function EcranKhatm() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, latin } = useTheme();
  const id = useParametre('id');
  const moi = useSession((s) => s.session?.user.id ?? null);
  const { etat, relire } = useKhatm(id);
  const [message, setMessage] = useState<string | null>(null);

  const resume = etat.etat === 'pret' ? resumeKhatm(etat.parts, moi) : null;
  const monJuz = resume?.monJuz ?? null;
  const khatmCharge = etat.etat === 'pret' ? etat.khatm : null;

  // Rappel local deux jours avant la fin, tant que mon juz n'est pas lu.
  useEffect(() => {
    if (!khatmCharge) return;
    programmerRappelKhatm(khatmCharge, monJuz).catch((e: unknown) => console.warn('Rappel de khatm', e));
  }, [khatmCharge, monJuz]);

  if (etat.etat !== 'pret' || !resume) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('khatm.titre')} />
        <View style={{ padding: espace.espace5 }}>
          {etat.etat === 'erreur' ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : <ActivityIndicator />}
        </View>
      </View>
    );
  }
  const { khatm, parts } = etat;

  const agir = async (f: () => Promise<boolean>, refus: string) => {
    setMessage(null);
    try {
      if (!(await f())) setMessage(refus);
      relire();
    } catch (e: unknown) {
      console.warn('Action de khatm impossible', e);
      setMessage(t('etats.erreurTexte'));
    }
  };

  // Lu : plein émeraude · en cours : or doux · le vôtre : contour émeraude · libre : contour discret.
  const couleurDe = (v: VuePart) =>
    v === 'lu'
      ? { fond: couleurs.emeraude, texte: couleurs.surEmeraude, bord: couleurs.emeraude }
      : v === 'leVotre'
        ? { fond: couleurs.emeraudeDoux, texte: couleurs.emeraude, bord: couleurs.emeraude }
        : v === 'enCours'
          ? { fond: couleurs.orDoux, texte: couleurs.orTexte, bord: couleurs.or }
          : { fond: couleurs.surface, texte: couleurs.encre, bord: couleurs.ligneForte };

  const ouvrirMonJuz = () => {
    const debut = resume.monJuz ? reperes().debutJuz(resume.monJuz) : null;
    if (debut)
      router.push({
        pathname: '/lire/coran/[sourate]',
        params: { sourate: debut.sourate, verset: debut.verset, mode: 'verset' },
      });
  };

  const echeance = khatm.echeance
    ? new Date(`${khatm.echeance}T12:00:00`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })
    : null;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour
        titre={t('khatm.titre')}
        actions={[{ icone: 'share', label: t('khatm.inviter'), onPress: () => void inviter(khatm.nom, khatm.code) }]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <View>
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.grand}
            style={[latin.titre1, { color: couleurs.emeraude }]}>
            {t('formules.entraide')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {t('formules.entraideTrad')}
          </Text>
        </View>
        {/* Carte du groupe : nom, objectif, avancée et résumé. */}
        <View
          style={[
            styles.carte,
            { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderRadius: rayon.rayonCarte, padding: espace.espace4, gap: espace.espace3 },
          ]}>
          <View style={[styles.ligneCarte, { gap: espace.espace3 }]}>
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre3, { color: couleurs.encre, flexShrink: 1 }]}>
              {khatm.nom}
            </Text>
            {echeance ? (
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                {t('khatm.objectif', { date: echeance })}
              </Text>
            ) : null}
          </View>
          {khatm.intention ? (
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
              {khatm.intention}
            </Text>
          ) : null}
          <ProgressBar
            valeur={resume.lus / 30}
            label={khatm.nom}
            detail={t('khatm.resumeComplet', {
              lus: resume.lus,
              enCours: resume.enCours,
              libres: resume.libres,
              dont: resume.dontLeVotre ? t('khatm.dontLeVotre') : '',
            })}
          />
        </View>

        {/* Grille des 30 juz : toucher un juz libre pour le prendre. */}
        <View style={[styles.grille, { gap: espace.espace2 }]}>
          {parts.map((p) => {
            const v = vuePart(p, moi);
            const c = couleurDe(v);
            return (
              <Pressable
                key={p.juz}
                accessibilityRole="button"
                accessibilityLabel={t('accessibilite.juz', {
                  n: p.juz,
                  etat: t(`khatm.${v === 'leVotre' ? 'vous' : v}`),
                })}
                disabled={v !== 'libre'}
                onPress={() => agir(() => prendreJuz(khatm.id, p.juz), t('khatm.dejaPris'))}
                style={({ pressed }) => [
                  styles.case,
                  {
                    borderRadius: rayon.rayonCarte,
                    backgroundColor: c.fond,
                    borderColor: c.bord,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Text style={[typographie.libelle, { color: c.texte }]}>{p.juz}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.legende, { gap: espace.espace3 }]}>
          {(['lu', 'enCours', 'leVotre', 'libre'] as const).map((v) => (
            <View key={v} style={[styles.legendeLigne, { gap: espace.espace1 }]}>
              <View style={[styles.pastille, { backgroundColor: couleurDe(v).fond, borderColor: couleurDe(v).bord }]} />
              <Text style={[typographie.legende, { color: couleurs.encre2 }]}>
                {t(`khatm.${v === 'leVotre' ? 'vous' : v}`)}
              </Text>
            </View>
          ))}
        </View>

        {message ? <Banner ton="attention">{message}</Banner> : null}
        {resume.monJuz !== null ? (
          <>
            <Button icone="book" pleineLargeur onPress={ouvrirMonJuz}>
              {t('khatm.continuer', { n: resume.monJuz })}
            </Button>
            <Button
              variant="secondaire"
              icone="check"
              pleineLargeur
              onPress={() =>
                resume.monJuz && agir(() => marquerJuzLu(khatm.id, resume.monJuz ?? 0), t('etats.erreurTexte'))
              }>
              {t('khatm.marquerLu')}
            </Button>
            <Button
              variant="discret"
              pleineLargeur
              onPress={() =>
                resume.monJuz && agir(() => rendreJuz(khatm.id, resume.monJuz ?? 0), t('etats.erreurTexte'))
              }>
              {t('khatm.rendre')}
            </Button>
          </>
        ) : (
          <Banner ton="info">{t('khatm.toucherLibre')}</Banner>
        )}
        <Button
          variant="discret"
          pleineLargeur
          onPress={() =>
            Alert.alert(t('khatm.quitterTitre'), t('khatm.quitterTexte'), [
              { text: t('commun.annuler'), style: 'cancel' },
              {
                text: t('khatm.quitter'),
                style: 'destructive',
                onPress: () =>
                  quitterKhatm(khatm.id)
                    .then(() => router.back())
                    .catch((e: unknown) => {
                      console.warn('Khatm non quitté', e);
                      setMessage(t('etats.erreurTexte'));
                    }),
              },
            ])
          }>
          {t('khatm.quitter')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  carte: { borderWidth: 1 },
  ligneCarte: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  case: { width: '15%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  legende: { flexDirection: 'row', flexWrap: 'wrap' },
  legendeLigne: { flexDirection: 'row', alignItems: 'center' },
  pastille: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
});
