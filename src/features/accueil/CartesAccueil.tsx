import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { joursRestants, resteAVivre } from '@/features/budget/cycle';
import { useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { useSession } from '@/features/compte/compte';
import { formules } from '@/features/dhikr/formules';
import { mesKhatms, useKhatm } from '@/features/khatm/depot';
import { resumeKhatm, vuePart, type Part } from '@/features/khatm/logique';
import { sourate } from '@/features/lire/coran';
import { cleJour } from '@/lib/dates';
import { useDhikr } from '@/stores/dhikr';
import { useLecture } from '@/stores/lecture';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import type { ClasseLargeur } from '@/theme/classesFenetre';
import { useTheme } from '@/theme/useTheme';
import { CarteAccueil } from '@/ui/CarteAccueil';

import { colonnesGrille } from './colonnes';
import { AnneauDhikr } from './AnneauDhikr';
import { FiletProgres } from './FiletProgres';

/** Carte « Reprendre » : la sourate et le verset où la lecture s'est arrêtée. Sans lecture : invitation à Al-Fâtiha. */
function CarteReprendre() {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
  const position = useLecture((s) => s.position);
  const reprise = position ? sourate(position.sourate) : undefined;
  return (
    <CarteAccueil
      icone="book"
      titre={t('accueil.reprendreLibelle')}
      pied={
        reprise && position ? (
          <FiletProgres
            ton="or"
            valeur={position.verset / reprise.versets}
            label={t('accueil.reprendreLibelle')}
            detail={t('accueil.versetSur', { n: position.verset, total: reprise.versets })}
          />
        ) : undefined
      }
      onPress={() =>
        position && reprise
          ? router.push({
              pathname: '/lire/coran/[sourate]',
              params: { sourate: reprise.n, verset: position.verset, mode: position.mode },
            })
          : router.push({ pathname: '/lire/coran/[sourate]', params: { sourate: 1 } })
      }>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre2, { color: couleurs.encre }]}>
        {reprise && position ? reprise.nom : t('accueil.premierJour')}
      </Text>
      {reprise && position ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
          {t('accueil.versetSur', { n: position.verset, total: reprise.versets })}
        </Text>
      ) : null}
    </CarteAccueil>
  );
}

/** Budget ouvert : le reste à vivre et les jours du cycle. Les montants suivent le masquage de l'œil du budget. */
function CarteBudgetOuverte() {
  const { t } = useTranslation();
  const { couleurs, typographie, latin } = useTheme();
  const format = useFormatMontant();
  const etat = useBudget(async (depot, carnet) => ({ mois: await depot.mois(carnet) }));
  const ouvrir = () => router.push('/budget');
  const titre = t('accueil.budgetTitre');

  if (etat.etat === 'vide') {
    return (
      <CarteAccueil icone="wallet" titre={titre} onPress={ouvrir}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('accueil.budgetCreer')}
        </Text>
      </CarteAccueil>
    );
  }
  if (etat.etat !== 'pret') return <CarteBudgetPrivee />;

  const { mois } = etat.donnees;
  const reste = resteAVivre({
    recu: mois.recu,
    misDeCote: mois.misDeCote,
    depenses: mois.depense,
    chargesFixesNonReglees: mois.chargesFixesNonReglees,
  });
  const jours = joursRestants(cleJour(new Date()), mois.cycle.fin);
  // Barre de la planche : la part du revenu du cycle encore disponible.
  const part = mois.recu > 0 ? reste / mois.recu : null;
  return (
    <CarteAccueil
      icone="wallet"
      titre={titre}
      onPress={ouvrir}
      pied={
        part !== null ? (
          <FiletProgres ton="emeraude" valeur={part} label={titre} detail={t('accueil.budgetJours', { count: jours })} />
        ) : undefined
      }>
      <Text maxFontSizeMultiplier={echelleMax.grand} style={[latin.titre3, styles.montant, { color: couleurs.encre }]}>
        {format(reste, etat.carnet.devise)}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
        {t('accueil.budgetJours', { count: jours })}
      </Text>
    </CarteAccueil>
  );
}

/** Budget verrouillé (ou illisible) : aucune donnée n'est lue, seul le libellé est affiché. */
function CarteBudgetPrivee() {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
  return (
    <CarteAccueil icone="lock" titre={t('accueil.budgetTitre')} onPress={() => router.push('/budget')}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
        {t('accueil.budgetPrive')}
      </Text>
    </CarteAccueil>
  );
}

function CarteBudget() {
  const verrouille = useReglages((s) => s.verrouBudget);
  // Verrou activé : on ne lit pas la base depuis l'Accueil, le budget se déverrouille dans son propre onglet.
  return verrouille ? <CarteBudgetPrivee /> : <CarteBudgetOuverte />;
}

function CarteDhikr() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const formule = useDhikr((s) => s.formule);
  const compte = useDhikr((s) => s.comptes[s.formule] ?? 0);
  const objectifChoisi = useDhikr((s) => s.objectifs[s.formule]);
  const f = formules.find((x) => x.id === formule);
  const objectif = objectifChoisi === undefined ? f?.objectif ?? null : objectifChoisi;
  return (
    <CarteAccueil icone="bolt" titre={t('accueil.dhikrTitre')} onPress={() => router.push('/priere/dhikr')}>
      <View style={[styles.dhikr, { gap: espace.espace3 }]}>
        {objectif ? (
          <AnneauDhikr compte={compte} objectif={objectif} />
        ) : (
          <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre2, styles.chiffres, { color: couleurs.encre }]}>
            {compte}
          </Text>
        )}
        <View style={styles.dhikrTextes}>
          {objectif ? (
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
              {t('accueil.dhikrSur', { objectif })}
            </Text>
          ) : null}
          {f ? (
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
              {f.translitteration}
            </Text>
          ) : null}
        </View>
      </View>
    </CarteAccueil>
  );
}

/** Grille des 30 juz de la planche : lus (doux), le vôtre (plein), en cours chez un autre (contour émeraude), libres (contour). */
function GrilleJuz({ parts, moi }: { parts: readonly Part[]; moi: string | null }) {
  const { couleurs } = useTheme();
  return (
    <View style={styles.grilleJuz}>
      {parts.map((p) => {
        const vue = vuePart(p, moi);
        const style =
          vue === 'lu'
            ? { backgroundColor: couleurs.emeraudeDoux }
            : vue === 'leVotre'
              ? { backgroundColor: couleurs.emeraude }
              : { borderWidth: 1, borderColor: vue === 'enCours' ? couleurs.emeraude : couleurs.ligneForte };
        return <View key={p.juz} style={[styles.juz, style]} />;
      })}
    </View>
  );
}

/** Sans khatm (hors connexion, aucun, ou pas encore chargé) : un texte qui invite. */
function CarteKhatmVide({ ouvrir, message }: { ouvrir: () => void; message: string }) {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
  return (
    <CarteAccueil icone="users" titre={t('accueil.khatmTitre')} onPress={ouvrir}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
        {message}
      </Text>
    </CarteAccueil>
  );
}

/** Khatm lu : carte au nom du khatm, la grille des 30 juz et l'avancée du premier khatm de la liste. */
function CarteKhatmLu({ id, ouvrir }: { id: string; ouvrir: () => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const moi = useSession((s) => s.session?.user.id ?? null);
  const { etat } = useKhatm(id);
  if (etat.etat !== 'pret') return <CarteKhatmVide ouvrir={ouvrir} message={t('accueil.khatmAucun')} />;
  const r = resumeKhatm(etat.parts, moi);
  const bilan = r.monJuz !== null ? t('accueil.khatmAvanceeJuz', { lus: r.lus, juz: r.monJuz }) : t('accueil.khatmAvancee', { lus: r.lus });
  return (
    <CarteAccueil
      icone="users"
      titre={etat.khatm.nom}
      label={`${etat.khatm.nom}. ${bilan}`}
      onPress={ouvrir}
      ecart={espace.espace2}
      pied={
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
          {bilan}
        </Text>
      }>
      <GrilleJuz parts={etat.parts} moi={moi} />
    </CarteAccueil>
  );
}

function CarteKhatm() {
  const { t } = useTranslation();
  const connecte = useSession((s) => s.session !== null);
  const [premier, setPremier] = useState<string | null>(null);
  useEffect(() => {
    if (!connecte) return;
    let actif = true;
    mesKhatms()
      .then((l) => actif && setPremier(l[0]?.id ?? null))
      .catch((erreur: unknown) => console.warn('Khatms illisibles', erreur));
    return () => {
      actif = false;
    };
  }, [connecte]);
  const ouvrir = () => router.push(premier ? { pathname: '/plus/khatm/[id]', params: { id: premier } } : '/plus/khatms');
  if (connecte && premier) return <CarteKhatmLu id={premier} ouvrir={ouvrir} />;
  return <CarteKhatmVide ouvrir={ouvrir} message={connecte ? t('accueil.khatmAucun') : t('accueil.khatmConnexion')} />;
}

/**
 * Grille des cartes : 2×2 en classe compacte, une colonne quand le texte est très agrandi (aucune carte tronquée),
 * quatre sur une ligne dès la classe moyenne.
 */
export function GrilleAccueil({ colonnes }: { colonnes: 1 | 2 | 4 }) {
  const { espace } = useTheme();
  const cartes = [<CarteReprendre key="r" />, <CarteKhatm key="k" />, <CarteBudget key="b" />, <CarteDhikr key="d" />];
  const taille = colonnes;
  const lignes: (typeof cartes)[] = [];
  for (let i = 0; i < cartes.length; i += taille) lignes.push(cartes.slice(i, i + taille));
  return (
    <View style={{ gap: espace.espace3 }}>
      {lignes.map((l, i) => (
        <View key={i} style={[styles.ligne, { gap: espace.espace3 }]}>
          {l}
        </View>
      ))}
    </View>
  );
}

/** Colonnes de la grille pour la fenêtre courante (classe de largeur et échelle de texte du téléphone). */
export function useColonnesGrille(largeur: ClasseLargeur) {
  const { fontScale } = useWindowDimensions();
  return colonnesGrille(largeur, fontScale);
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row' },
  chiffres: { fontVariant: ['tabular-nums'] },
  // Planche : textes secondaires des cartes en 14/20, montant en 24/30 (Source Sans, gras).
  detail: { fontSize: 14, lineHeight: 20 },
  montant: { fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  dhikr: { flexDirection: 'row', alignItems: 'center' },
  dhikrTextes: { flex: 1 },
  // 30 carrés de 10, dix par rangée, écart 4 (136 de large).
  grilleJuz: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: 136 },
  juz: { width: 10, height: 10, borderRadius: 3 },
});
