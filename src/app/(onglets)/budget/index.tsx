import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { basculerMontants, useEtatVerrou, useFormatMontant } from '@/features/budget/verrou';
import { depassement, depenseDuJour, joursRestants, pasArrondi, resteAVivre } from '@/features/budget/cycle';
import { iconeEnveloppe } from '@/features/budget/enveloppesDeDepart';
import { NOM_ENVELOPPE_MAX } from '@/features/budget/depot';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { FeuilleRevenu } from '@/features/budget/FeuilleRevenu';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { cleJour, formatJourCle } from '@/lib/dates';
import { lireMontantFacultatif } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Envelope } from '@/ui/Envelope';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';

export default function Budget() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const masques = useEtatVerrou((s) => s.montantsMasques);
  // Icône œil : masque ou montre tous les montants du budget (« ••• »).
  const oeil = {
    icone: masques ? ('eye' as const) : ('eye-off' as const),
    label: masques ? t('budget.montrerLesMontants') : t('budget.masquerLesMontants'),
    actif: masques,
    onPress: basculerMontants,
  };
  const { couleurs, espace, rayon, typographie } = useTheme();
  const etat = useBudget(async (depot, carnet) => ({
    mois: await depot.mois(carnet),
    archivees: await depot.enveloppesArchivees(carnet),
    comptes: await depot.comptes(carnet.id),
    bilan: await depot.bilanAFaire(carnet),
  }));
  // Feuille « Ajouter une enveloppe » : nom et plafond.
  const [feuille, setFeuille] = useState(false);
  const [nom, setNom] = useState('');
  const [plafond, setPlafond] = useState('');
  const [echec, setEchec] = useState(false);
  const [feuilleRevenu, setFeuilleRevenu] = useState(false);

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar grand titre={t('budget.titre')} sousTitre={t('budget.surTelephone')} />
        <EtatsBudget etat={etat} />
      </View>
    );
  }

  const { carnet } = etat;
  const { mois, archivees, comptes, bilan } = etat.donnees;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const aujourdhui = cleJour(new Date());
  const jours = joursRestants(aujourdhui, mois.cycle.fin);
  const reste = resteAVivre({
    recu: mois.recu,
    misDeCote: mois.misDeCote,
    depenses: mois.depense,
    chargesFixesNonReglees: mois.chargesFixesNonReglees,
  });
  const duJour = depenseDuJour(reste, jours, pasArrondi(devise));
  const depasse = depassement(reste);
  const nomPropre = nom.trim();
  const nomValide = nomPropre.length >= 1 && nomPropre.length <= NOM_ENVELOPPE_MAX;
  const plafondMinimes = lireMontantFacultatif(plafond, devise);

  const ajouterEnveloppe = async () => {
    if (!nomValide || plafondMinimes === null) return;
    try {
      await etat.depot.ajouterEnveloppe(carnet, {
        nom: nomPropre,
        icone: 'wallet',
        fixe: false,
        plafond: plafondMinimes,
      });
      setFeuille(false);
      budgetModifie();
    } catch (erreur: unknown) {
      console.error('Enveloppe non ajoutée', erreur);
      setEchec(true);
    }
  };

  const sousTitre = t('budget.cycle', {
    debut: formatJourCle(mois.cycle.debut, i18n.language),
    fin: formatJourCle(mois.cycle.fin, i18n.language),
  });

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar grand titre={t('budget.titre')} sousTitre={sousTitre} actions={[oeil]} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        {/* Cycle précédent terminé mais pas clos : une invitation douce, jamais un blocage. */}
        {bilan ? (
          <Banner ton="info" action={{ label: t('budget.faireBilan'), onPress: () => router.push('/budget/bilan') }}>
            {t('budget.bilanBandeau', {
              debut: formatJourCle(bilan.cycle.debut, i18n.language),
              fin: formatJourCle(bilan.cycle.fin, i18n.language),
            })}
          </Banner>
        ) : null}
        {/* La carte du haut ouvre la liste des revenus du cycle : ajouter, corriger ou supprimer un revenu. */}
        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('budget.voirRevenus')}
          android_ripple={{ color: couleurs.emeraudeDoux }}
          onPress={() => router.push('/budget/revenus')}
          style={({ pressed }) => ({
            padding: espace.espace5,
            borderRadius: rayon.rayonCarte,
            backgroundColor: couleurs.emeraude,
            overflow: 'hidden',
            opacity: pressed ? 0.9 : 1,
          })}>
          <AmountDisplay
            surEmeraude
            montant={duJour}
            devise={devise}
            libelle={t('budget.depenseDuJour')}
            detail={
              depasse > 0
                ? t('budget.depasseTotal', { montant: f(depasse) })
                : t('budget.depenseDuJourDetail', { reste: f(reste), jours: t('budget.jours', { count: jours }) })
            }
          />
        </Pressable>

        <View style={[styles.totaux, { gap: espace.espace3 }]}>
          {[
            [t('budget.recu'), mois.recu],
            [t('budget.depense'), mois.depense],
            [t('budget.epargne'), mois.misDeCote],
          ].map(([libelle, montant]) => (
            <View key={String(libelle)} accessible style={styles.total}>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.legende, { color: couleurs.encre3 }]}>
                {libelle}
              </Text>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[typographie.libelle, { color: couleurs.encre, fontVariant: ['tabular-nums'] }]}>
                {f(Number(montant))}
              </Text>
            </View>
          ))}
        </View>

        <Button icone="plus" pleineLargeur onPress={() => router.push('/budget-ajout')}>
          {t('budget.ajouterDepense')}
        </Button>
        <Button variant="secondaire" icone="plus" pleineLargeur onPress={() => setFeuilleRevenu(true)}>
          {t('budget.ajouterRevenu')}
        </Button>

        <ListGroup>
          <ListItem
            icone="calendar"
            titre={t('budget.paieTitre')}
            sousTitre={t('budget.paieAide')}
            onPress={() => router.push('/budget/paie')}
          />
          <ListItem
            icone="list"
            titre={t('budget.historique')}
            sousTitre={t('budget.voirHistorique')}
            onPress={() => router.push('/budget/historique')}
          />
          <ListItem
            icone="wallet"
            titre={t('budget.comptes')}
            sousTitre={t('budget.voirComptes')}
            onPress={() => router.push('/budget/comptes')}
          />
          <ListItem
            icone="target"
            titre={t('epargne.titre')}
            sousTitre={t('epargne.voir')}
            onPress={() => router.push('/budget/epargne')}
          />
          <ListItem
            icone="balance"
            titre={t('zakat.titre')}
            sousTitre={t('zakat.voir')}
            onPress={() => router.push('/budget/zakat')}
          />
          <ListItem
            icone="users"
            titre={t('dettes.titre')}
            sousTitre={t('dettes.voir')}
            onPress={() => router.push('/budget/dettes')}
          />
          <ListItem
            icone="globe"
            titre={t('devise.titre')}
            valeur={carnet.devise.symbole}
            onPress={() => router.push('/budget/devise')}
          />
        </ListGroup>

        <View>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.titre3, { color: couleurs.encre }]}>
            {t('budget.enveloppes')}
          </Text>
          {mois.enveloppes.map((e) => (
            <Envelope
              key={e.id}
              nom={e.nom}
              icone={iconeEnveloppe(e.icone)}
              depense={e.depense}
              plafond={e.plafond}
              fixe={e.fixe}
              devise={devise}
              onPress={() => router.push({ pathname: '/budget/enveloppe/[id]', params: { id: e.id } })}
            />
          ))}
        </View>

        <Button
          variant="secondaire"
          icone="plus"
          pleineLargeur
          onPress={() => {
            setNom('');
            setPlafond('');
            setEchec(false);
            setFeuille(true);
          }}>
          {t('budget.nouvelleEnveloppe')}
        </Button>

        {/* Archivées avant la suppression : cachées, mais leurs dépenses comptent ; on peut les rouvrir. */}
        {archivees.length > 0 ? (
          <ListGroup titre={t('budget.enveloppesArchivees')}>
            {archivees.map((a) => (
              <ListItem
                key={a.id}
                icone={iconeEnveloppe(a.icone)}
                titre={a.nom}
                sousTitre={t('budget.depensesTotal', { count: a.nombre, montant: f(a.total) })}
                onPress={() => router.push({ pathname: '/budget/enveloppe/[id]', params: { id: a.id } })}
              />
            ))}
          </ListGroup>
        ) : null}
      </ScrollView>

      <BottomSheet ouvert={feuille} titre={t('budget.nouvelleEnveloppe')} onFermer={() => setFeuille(false)}>
        <TextField
          label={t('budget.nomEnveloppe')}
          valeur={nom}
          onChange={setNom}
          maxLength={NOM_ENVELOPPE_MAX}
          erreur={nom !== '' && !nomValide ? t('budget.nomInvalide') : undefined}
        />
        <TextField
          label={t('budget.plafond')}
          valeur={plafond}
          onChange={setPlafond}
          clavier={devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
          suffixe={devise.symbole}
          placeholder="0"
          erreur={plafondMinimes === null ? t('budget.montantInvalide') : undefined}
        />
        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        <Button pleineLargeur disabled={!nomValide || plafondMinimes === null} onPress={ajouterEnveloppe}>
          {t('commun.enregistrer')}
        </Button>
      </BottomSheet>

      <FeuilleRevenu
        ouvert={feuilleRevenu}
        onFermer={() => setFeuilleRevenu(false)}
        carnet={carnet}
        depot={etat.depot}
        comptes={comptes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  totaux: { flexDirection: 'row' },
  total: { flex: 1 },
});
