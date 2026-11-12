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
  retirerMembre,
  signalerMembre,
  useKhatm,
  type Membre,
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

import { interlignes, tailles } from '@/theme/tokens.generated';
/** Un khatm collectif : les 30 juz en direct, mon juz, inviter. */
export default function EcranKhatm() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, latin } = useTheme();
  const id = useParametre('id');
  const moi = useSession((s) => s.session?.user.id ?? null);
  const { etat, relire } = useKhatm(id);
  const [message, setMessage] = useState<string | null>(null);
  const [largeur, setLargeur] = useState(0);
  // Six colonnes : largeur de chaque case, écarts de 8 déduits.
  const caseLargeur = largeur > 0 ? Math.floor((largeur - espace.espace2 * 5) / 6) : '15%';

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
          {etat.etat === 'erreur' ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
          {etat.etat === 'introuvable' ? <Banner ton="erreur">{t('khatm.introuvable')}</Banner> : null}
          {etat.etat === 'chargement' ? <ActivityIndicator /> : null}
        </View>
      </View>
    );
  }
  const { khatm, parts, membres } = etat;
  const suisCreateur = moi !== null && khatm.createur === moi;

  const signaler = (cible: Membre) =>
    Alert.alert(t('khatm.signalerTitre'), t('khatm.signalerTexte'), [
      { text: t('commun.annuler'), style: 'cancel' },
      {
        text: t('khatm.signalerAction'),
        style: 'destructive',
        onPress: () =>
          signalerMembre(khatm.id, cible.user_id)
            .then(() => setMessage(t('khatm.signale')))
            .catch((e: unknown) => {
              console.warn('Signalement impossible', e);
              setMessage(t('etats.erreurTexte'));
            }),
      },
    ]);

  const retirer = (cible: Membre) =>
    Alert.alert(t('khatm.retirerTitre'), t('khatm.retirerTexte'), [
      { text: t('commun.annuler'), style: 'cancel' },
      {
        text: t('khatm.retirerAction'),
        style: 'destructive',
        onPress: () =>
          retirerMembre(khatm.id, cible.user_id)
            .then(() => relire())
            .catch((e: unknown) => {
              console.warn('Retrait impossible', e);
              setMessage(t('etats.erreurTexte'));
            }),
      },
    ]);

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
      ? { fond: couleurs.emeraudeAplat, texte: couleurs.surEmeraude, bord: couleurs.emeraudeAplat }
      : v === 'leVotre'
        ? { fond: couleurs.emeraudeDoux, texte: couleurs.emeraude, bord: couleurs.emeraude }
        : v === 'enCours'
          ? { fond: couleurs.orDoux, texte: couleurs.orTexte, bord: couleurs.or }
          : { fond: couleurs.surface, texte: couleurs.encre, bord: couleurs.ligneForte };

  const ouvrirMonJuz = () => {
    const debut = resume.monJuz ? reperes().debutJuz(resume.monJuz) : null;
    if (debut)
      router.push({
        pathname: '/coran/[sourate]',
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
        centre
        titre={t('khatm.titre')}
        actions={[{ icone: 'share', texte: t('khatm.inviter'), libelle: true, label: t('khatm.inviter'), onPress: () => void inviter(khatm.nom, khatm.code) }]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace6,
          paddingBottom: espace.espace8,
          gap: espace.espace4,
        }}>
        <View style={{ gap: espace.espace1 }}>
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.grand}
            style={[latin.titre1, { color: couleurs.emeraude }]}>
            {t('formules.entraide')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, styles.trad, { color: couleurs.encre2 }]}>
            {t('formules.entraideTrad')}
          </Text>
        </View>
        {/* Carte du groupe : nom, objectif, avancée et résumé. */}
        <View
          style={[
            styles.carte,
            { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderRadius: rayon.rayonCarte, padding: espace.espace4, gap: espace.espace2 },
          ]}>
          <View style={[styles.ligneCarte, { gap: espace.espace3 }]}>
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.corps, styles.nom, { color: couleurs.encre }]}>
              {khatm.nom}
            </Text>
            {echeance ? (
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.regulier, { color: couleurs.encre3 }]}>
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
            fine
            detailCorps
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
        <View style={[styles.grille, { gap: espace.espace2 }]} onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}>
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
                    width: caseLargeur,
                    borderWidth: v === 'leVotre' ? 2 : 1,
                    borderRadius: 10,
                    backgroundColor: c.fond,
                    borderColor: c.bord,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Text style={[typographie.libelle, styles.chiffre, { color: c.texte }]}>{p.juz}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.legende, { gap: espace.espace4 }]}>
          {(['lu', 'enCours', 'leVotre', 'libre'] as const).map((v) => (
            <View key={v} style={[styles.legendeLigne, { gap: espace.espace2 }]}>
              <View style={[styles.pastille, { backgroundColor: couleurDe(v).fond, borderColor: couleurDe(v).bord, borderWidth: v === 'leVotre' ? 2 : 1 }]} />
              <Text style={[typographie.legende, { color: couleurs.encre2 }]}>
                {t(`khatm.${v === 'leVotre' ? 'vous' : v}`)}
              </Text>
            </View>
          ))}
        </View>

        {message ? <Banner ton="attention">{message}</Banner> : null}
        {resume.monJuz !== null ? (
          <>
            <Button grand pleineLargeur onPress={ouvrirMonJuz}>
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
        {/* Membres : chacun peut signaler un autre membre ; le créateur peut en retirer un. */}
        <View style={{ gap: espace.espace2 }}>
          <Text accessibilityRole="header" style={[typographie.libelle, { color: couleurs.encre2 }]}>
            {t('khatm.membres')}
          </Text>
          {membres.map((m) => {
            const estMoi = m.user_id === moi;
            return (
              <View key={m.user_id} style={[styles.ligneMembre, { gap: espace.espace2 }]}>
                <Text style={[typographie.corps, styles.nomMembre, { color: couleurs.encre }]} numberOfLines={1}>
                  {estMoi ? t('khatm.moi') : (m.prenom ?? t('khatm.membreAnonyme'))}
                </Text>
                {!estMoi ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={t('khatm.signaler')} onPress={() => signaler(m)} hitSlop={8}>
                    <Text style={[typographie.legende, { color: couleurs.emeraude }]}>{t('khatm.signaler')}</Text>
                  </Pressable>
                ) : null}
                {suisCreateur && !estMoi ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={t('khatm.retirer')} onPress={() => retirer(m)} hitSlop={8}>
                    <Text style={[typographie.legende, { color: couleurs.encre2 }]}>{t('khatm.retirer')}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>

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
  case: { height: 44, alignItems: 'center', justifyContent: 'center' },
  chiffre: { fontVariant: ['tabular-nums'] },
  nom: { flexShrink: 1, fontFamily: 'SourceSans3_600SemiBold' },
  regulier: { fontFamily: 'SourceSans3_400Regular' },
  trad: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  legende: { flexDirection: 'row', flexWrap: 'wrap' },
  legendeLigne: { flexDirection: 'row', alignItems: 'center' },
  ligneMembre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  nomMembre: { flexShrink: 1 },
  pastille: { width: 12, height: 12, borderRadius: 3 },
});
