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
import { resumeKhatm } from '@/features/khatm/logique';
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
import { ProgressBar } from '@/ui/ProgressBar';

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
        <>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
            {t('accueil.versetSur', { n: position.verset, total: reprise.versets })}
          </Text>
          <ProgressBar
            fine
            ton="or"
            valeur={Math.min(1, position.verset / reprise.versets)}
            label={t('accueil.reprendreLibelle')}
            detail={t('accueil.versetSur', { n: position.verset, total: reprise.versets })}
          />
        </>
      ) : null}
    </CarteAccueil>
  );
}

/** Budget ouvert : le reste à vivre et les jours du cycle. Les montants suivent le masquage de l'œil du budget. */
function CarteBudgetOuverte() {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
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
  return (
    <CarteAccueil icone="wallet" titre={titre} onPress={ouvrir}>
      <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre2, styles.chiffres, { color: couleurs.encre }]}>
        {format(reste, etat.carnet.devise)}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
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
  const { couleurs, typographie } = useTheme();
  const formule = useDhikr((s) => s.formule);
  const compte = useDhikr((s) => s.comptes[s.formule] ?? 0);
  const objectifChoisi = useDhikr((s) => s.objectifs[s.formule]);
  const f = formules.find((x) => x.id === formule);
  const objectif = objectifChoisi === undefined ? f?.objectif ?? null : objectifChoisi;
  return (
    <CarteAccueil icone="bolt" titre={t('accueil.dhikrTitre')} onPress={() => router.push('/priere/dhikr')}>
      <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre2, styles.chiffres, { color: couleurs.encre }]}>
        {compte}
      </Text>
      {objectif ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {t('accueil.dhikrSur', { objectif })}
        </Text>
      ) : null}
      {f ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {f.translitteration}
        </Text>
      ) : null}
    </CarteAccueil>
  );
}

/** Khatm lu : avancée du premier khatm de la liste. */
function KhatmResume({ id }: { id: string }) {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
  const moi = useSession((s) => s.session?.user.id ?? null);
  const { etat } = useKhatm(id);
  if (etat.etat !== 'pret') return null;
  const r = resumeKhatm(etat.parts, moi);
  return (
    <>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.encre }]}>
        {etat.khatm.nom}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
        {r.monJuz !== null ? t('accueil.khatmAvanceeJuz', { lus: r.lus, juz: r.monJuz }) : t('accueil.khatmAvancee', { lus: r.lus })}
      </Text>
    </>
  );
}

function CarteKhatm() {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
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
  return (
    <CarteAccueil icone="users" titre={t('accueil.khatmTitre')} onPress={ouvrir}>
      {connecte && premier ? (
        <KhatmResume id={premier} />
      ) : (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {connecte ? t('accueil.khatmAucun') : t('accueil.khatmConnexion')}
        </Text>
      )}
    </CarteAccueil>
  );
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
});
