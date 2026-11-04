import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { BienZakat } from '@/features/budget/depot';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { baseDeCalcul, BASES_NISAB, coursAncien, mgVersGrammes, valeurMetal } from '@/features/budget/zakat';
import { cleJour, formatJourCle } from '@/lib/dates';
import { versMinimes, versSaisie } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Mes biens : base du nisab, prix du gramme, ce que je possède et ce qui est à déduire. */
export default function BiensZakat() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { afficher } = useToast();
  const etat = useBudget((depot, carnet) => depot.zakat(carnet));
  // null tant que l'utilisateur n'a rien touché : les champs montrent les prix enregistrés.
  const [prixOr, setPrixOr] = useState<string | null>(null);
  const [prixArgent, setPrixArgent] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('zakat.mesBiens')} etat={etat} />;
  }

  const { carnet, depot, donnees: z } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const { reglages: r, composition: c } = z;
  const clavier = devise.decimales > 0 ? 'decimal-pad' : 'number-pad';
  const enSaisie = (m: number | null) => (m ? (versSaisie(m, devise) ?? '') : '');
  const valOr = prixOr ?? enSaisie(r.prixOr);
  const valArgent = prixArgent ?? enSaisie(r.prixArgent);
  // Champ vide : prix effacé ; sinon un montant positif.
  const lire = (s: string) => {
    if (s.trim() === '') return { ok: true, valeur: null };
    const m = versMinimes(s, devise);
    return m !== null && m > 0 ? { ok: true, valeur: m } : { ok: false, valeur: null };
  };
  const lu = { or: lire(valOr), argent: lire(valArgent) };
  const prixModifies = prixOr !== null || prixArgent !== null;

  const declares = (type: BienZakat['type']) =>
    z.biens.filter((b) => b.type === type).reduce((total, b) => total + (b.montant ?? 0), 0);
  const creancesAuto = c.creances - declares('creance');
  const dettesAuto = c.dettes - declares('dette');
  const base = baseDeCalcul(c);
  const auDessus = z.nisab !== null && base >= z.nisab;

  const agir = async (action: () => Promise<void>) => {
    setEnvoi(true);
    setEchec(false);
    try {
      await action();
      budgetModifie();
      afficher({ texte: t('zakat.enregistre'), icone: 'check' });
    } catch (erreur: unknown) {
      console.error('Réglage de zakat non enregistré', erreur);
      setEchec(true);
    }
    setEnvoi(false);
  };

  const ligneBien = (b: BienZakat) => {
    const prix = b.type === 'or' ? r.prixOr : b.type === 'argent' ? r.prixArgent : null;
    const grammes = mgVersGrammes(b.milligrammes ?? 0);
    const valeur =
      b.type === 'or' || b.type === 'argent'
        ? prix
          ? t('zakat.grammesValeur', { grammes, valeur: f(valeurMetal(b.milligrammes ?? 0, prix)) })
          : t('zakat.grammesSansPrix', { grammes })
        : f(b.montant ?? 0);
    return (
      <ListItem
        key={b.id}
        icone={b.type === 'or' || b.type === 'argent' ? 'heart' : b.type === 'dette' ? 'minus' : 'wallet'}
        ton={b.type === 'or' ? 'or' : undefined}
        titre={b.libelle ?? t(`zakat.biensTypes.${b.type}`)}
        sousTitre={b.libelle ? t(`zakat.biensTypes.${b.type}`) : undefined}
        valeur={b.type === 'dette' ? `− ${valeur}` : valeur}
        onPress={() => router.push({ pathname: '/budget/zakat/bien', params: { id: b.id } })}
      />
    );
  };

  const noteDuPrix =
    r.prixMajLe === null
      ? t('zakat.prixJamais')
      : coursAncien(r.prixMajLe, cleJour(new Date()))
        ? t('zakat.prixAncien', { date: formatJourCle(r.prixMajLe, i18n.language) })
        : t('zakat.coursDate', { date: formatJourCle(r.prixMajLe, i18n.language) });

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('zakat.mesBiens')} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace4,
          }}>
          <SegmentedControl
            label={t('zakat.seuilSur')}
            options={BASES_NISAB.map((id) => ({ id, label: id === 'or' ? t('zakat.or') : t('zakat.argent') }))}
            valeur={r.base}
            onChange={(id) => {
              const choix = BASES_NISAB.find((b) => b === id);
              if (choix && choix !== r.base) void agir(() => depot.reglerZakat(carnet, { base: choix }));
            }}
          />
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
            {`${r.base === 'or' ? t('zakat.explicOr') : t('zakat.explicArgent')} ${t('zakat.explicHawl')}`}
          </Text>

          <TextField
            label={t('zakat.prixArgent')}
            valeur={valArgent}
            onChange={setPrixArgent}
            clavier={clavier}
            suffixe={devise.symbole}
            placeholder="0"
            erreur={!lu.argent.ok ? t('budget.montantInvalide') : undefined}
          />
          <TextField
            label={t('zakat.prixOr')}
            valeur={valOr}
            onChange={setPrixOr}
            clavier={clavier}
            suffixe={devise.symbole}
            placeholder="0"
            aide={noteDuPrix}
            erreur={!lu.or.ok ? t('budget.montantInvalide') : undefined}
          />
          {prixModifies ? (
            <Button
              variant="secondaire"
              pleineLargeur
              disabled={!lu.or.ok || !lu.argent.ok || envoi}
              onPress={() =>
                agir(async () => {
                  await depot.reglerZakat(carnet, { prixOr: lu.or.valeur, prixArgent: lu.argent.valeur });
                  setPrixOr(null);
                  setPrixArgent(null);
                })
              }>
              {t('zakat.enregistrerPrix')}
            </Button>
          ) : null}

          <ListGroup titre={t('zakat.possede')}>
            <ListItem
              icone="wallet"
              titre={t('zakat.sousEpargneComptes')}
              sousTitre={t('zakat.reprisAuto')}
              valeur={f(c.epargne + c.comptes)}
            />
            <ListItem
              icone="users"
              titre={t('zakat.ligneCreances')}
              sousTitre={t('zakat.sousCreances')}
              valeur={f(creancesAuto)}
            />
            {z.biens.filter((b) => b.type !== 'dette').map(ligneBien)}
          </ListGroup>
          <ListGroup titre={t('zakat.aDeduire')}>
            <ListItem
              icone="minus"
              titre={t('zakat.ligneDettes')}
              sousTitre={t('zakat.sousDettes')}
              valeur={`− ${f(dettesAuto)}`}
            />
            {z.biens.filter((b) => b.type === 'dette').map(ligneBien)}
          </ListGroup>
          <Button variant="discret" icone="plus" onPress={() => router.push('/budget/zakat/bien')}>
            {t('zakat.ajouterBien')}
          </Button>

          {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

          <View
            accessible
            style={{
              padding: espace.espace4,
              gap: 2,
              borderRadius: rayon.rayonCarte,
              backgroundColor: couleurs.emeraudeDoux,
            }}>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.legende, { color: couleurs.surEmeraudeDoux }]}>
              {t('zakat.patrimoine', {
                montant: f(base),
                position:
                  z.nisab === null ? t('zakat.sansCoursTitre') : auDessus ? t('zakat.auDessus') : t('zakat.enDessous'),
              })}
            </Text>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre3, { color: couleurs.surEmeraudeDoux }]}>
              {t('zakat.zakatLigne', { montant: f(z.etat.type === 'due' ? z.etat.montant : 0) })}
            </Text>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.legende, { color: couleurs.surEmeraudeDoux }]}>
              {t('zakat.estimation')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
