import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { versMinimes, versSaisie } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Jour de paie : le revenu reçu, mettre de côté d'abord, puis répartir entre les enveloppes. */
export default function JourDePaie() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const etat = useBudget(async (depot, carnet) => ({
    mois: await depot.mois(carnet),
    comptes: await depot.comptes(carnet.id),
    objectifs: (await depot.epargne(carnet)).objectifs,
  }));
  // Versements par objectif modifiés ; les autres gardent le versement prévu à chaque paie.
  const [versements, setVersements] = useState<Record<string, string>>({});
  const [revenu, setRevenu] = useState('');
  const [compteId, setCompteId] = useState<string | null>(null);
  const [epargne, setEpargne] = useState('');
  const [sadaqa, setSadaqa] = useState('');
  // Plafonds modifiés ; les autres gardent la répartition du cycle (reprise du précédent).
  const [plafonds, setPlafonds] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('budget.paieTitre')} />
        <EtatsBudget etat={etat} />
      </View>
    );
  }

  const { carnet, depot, donnees } = etat;
  const { mois, comptes, objectifs } = donnees;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const lire = (saisie: string) => (saisie.trim() === '' ? 0 : versMinimes(saisie, devise));
  const clavier = devise.decimales > 0 ? 'decimal-pad' : 'number-pad';
  const compte = comptes.find((c) => c.id === compteId) ?? comptes[0];

  const revenuM = lire(revenu);
  const epargneM = lire(epargne);
  const sadaqaM = lire(sadaqa);
  const lignes = mois.enveloppes.map((e) => {
    const actuel = e.plafond - e.report;
    const saisie = plafonds[e.id] ?? versSaisie(actuel, devise) ?? '';
    return { e, saisie, montant: lire(saisie) };
  });
  const lignesObjectifs = objectifs.map((o) => {
    const saisie = versements[o.id] ?? (o.versementMensuel ? (versSaisie(o.versementMensuel, devise) ?? '') : '');
    return { o, saisie, montant: lire(saisie) };
  });
  const valide = [
    revenuM,
    epargneM,
    sadaqaM,
    ...lignes.map((l) => l.montant),
    ...lignesObjectifs.map((l) => l.montant),
  ].every((m) => m !== null);
  const reparti = lignes.reduce((total, l) => total + (l.montant ?? 0), 0);
  const versementsTotal = lignesObjectifs.reduce((total, l) => total + (l.montant ?? 0), 0);
  const restant =
    mois.recu + (revenuM ?? 0) - (mois.misDeCote + (epargneM ?? 0) + versementsTotal + (sadaqaM ?? 0)) - reparti;

  const valider = async () => {
    if (!valide) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.jourDePaie(carnet, {
        revenu: revenuM ?? 0,
        compteId: compte?.id ?? null,
        epargne: epargneM ?? 0,
        sadaqa: sadaqaM ?? 0,
        plafonds: lignes.map((l) => ({ enveloppeId: l.e.id, montant: l.montant ?? 0 })),
        versements: lignesObjectifs.map((l) => ({ objectifId: l.o.id, montant: l.montant ?? 0 })),
      });
      budgetModifie();
      afficher({ texte: t('budget.paieEnregistree'), icone: 'check' });
      router.back();
    } catch (erreur: unknown) {
      console.error('Jour de paie non enregistré', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  const titreSection = (texte: string) => (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={echelleMax.courant}
      style={[typographie.titre3, { color: couleurs.encre }]}>
      {texte}
    </Text>
  );

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('budget.paieTitre')} sousTitre={t('budget.paieSousTitre')} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace4,
          }}>
          <TextField
            label={t('budget.revenuRecu')}
            valeur={revenu}
            onChange={setRevenu}
            clavier={clavier}
            suffixe={devise.symbole}
            placeholder="0"
            erreur={revenuM === null ? t('budget.montantInvalide') : undefined}
          />
          {comptes.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espace.espace2 }}>
              {comptes.map((c) => (
                <Chip key={c.id} selectionne={c.id === compte?.id} onPress={() => setCompteId(c.id)}>
                  {c.nom}
                </Chip>
              ))}
            </ScrollView>
          ) : null}

          {titreSection(t('budget.mettreDeCote'))}
          {lignesObjectifs.map(({ o, saisie, montant }) => (
            <TextField
              key={o.id}
              label={o.nom}
              valeur={saisie}
              onChange={(texte) => setVersements((v) => ({ ...v, [o.id]: texte }))}
              clavier={clavier}
              suffixe={devise.symbole}
              placeholder="0"
              aide={o.intention ?? undefined}
              erreur={montant === null ? t('budget.montantInvalide') : undefined}
            />
          ))}
          <TextField
            label={objectifs.length > 0 ? t('epargne.autreEpargne') : t('budget.epargneMontant')}
            valeur={epargne}
            onChange={setEpargne}
            clavier={clavier}
            suffixe={devise.symbole}
            placeholder="0"
            erreur={epargneM === null ? t('budget.montantInvalide') : undefined}
          />
          <TextField
            label={t('budget.sadaqaMontant')}
            valeur={sadaqa}
            onChange={setSadaqa}
            clavier={clavier}
            suffixe={devise.symbole}
            placeholder="0"
            erreur={sadaqaM === null ? t('budget.montantInvalide') : undefined}
          />

          {titreSection(t('budget.repartir'))}
          {lignes.map(({ e, saisie, montant }) => (
            <TextField
              key={e.id}
              label={e.nom}
              valeur={saisie}
              onChange={(texte) => setPlafonds((p) => ({ ...p, [e.id]: texte }))}
              clavier={clavier}
              suffixe={devise.symbole}
              aide={e.report > 0 ? `+ ${f(e.report)} · ${t('budget.reporter')}` : undefined}
              erreur={montant === null ? t('budget.montantInvalide') : undefined}
            />
          ))}

          {/* Le reste non réparti s'affiche tant qu'il n'est pas nul ; il n'empêche pas de valider. */}
          {restant !== 0 ? (
            <Banner
              ton={restant < 0 ? 'attention' : 'info'}
              icone={restant < 0 ? 'alert' : 'info'}
              titre={t('budget.nonReparti')}>
              {f(restant)}
            </Banner>
          ) : null}
          {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

          <Button pleineLargeur disabled={!valide || envoi} onPress={valider}>
            {t('budget.validerRepartition')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
