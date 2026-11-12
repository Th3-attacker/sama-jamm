import { router, useScrollToTop } from 'expo-router';
import { ComponentRef, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { basculerMontants, useEtatVerrou, useFormatMontant } from '@/features/budget/verrou';
import { depassement, depenseDuJour, joursRestants, pasArrondi, resteAVivre } from '@/features/budget/cycle';
import { iconeEnveloppe } from '@/features/budget/enveloppesDeDepart';
import { resumeDettes } from '@/features/budget/dettes';
import { NOM_ENVELOPPE_MAX, nonReparti } from '@/features/budget/depot';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { FeuilleRevenu } from '@/features/budget/FeuilleRevenu';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { cleJour, formatJourCle } from '@/lib/dates';
import { lireMontantFacultatif } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useLayout } from '@/theme/useLayout';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Envelope } from '@/ui/Envelope';
import { Icon } from '@/ui/Icon';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';
import { VersetRubrique } from '@/ui/VersetRubrique';
import { versetRubrique } from '@/features/rubriques/versetsRubriques';
import { useDessousOutil, useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { espace, interlignes, rayon, tailles } from '@/theme/tokens.generated';
// Verset du Coran de la rubrique : données embarquées, lues une fois.
const verset = versetRubrique('budget');

export default function Budget() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(defilement);
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
  const marge = useMargeBasse();
  const dessous = useDessousOutil();
  const { styleColonne: colonne } = useLayout();
  const etat = useBudget(async (depot, carnet) => ({
    mois: await depot.mois(carnet),
    archivees: await depot.enveloppesArchivees(carnet),
    comptes: await depot.comptes(carnet.id),
    bilan: await depot.bilanAFaire(carnet),
    dettes: await depot.dettes(carnet, 'ouvertes'),
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
  const { mois, archivees, comptes, bilan, dettes } = etat.donnees;
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

  const recuMois = Math.max(mois.recu, 1);
  const largeur = (m: number) => `${Math.min(100, Math.max(0, (m / recuMois) * 100))}%` as const;
  const resume = resumeDettes(dettes);
  const surTexte = { maxFontSizeMultiplier: echelleMax.courant } as const;
  const corps14 = { ...typographie.corps, fontSize: tailles.t14, lineHeight: interlignes.l20 };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar actions={[oeil]} />
      <ScrollView ref={defilement}
        contentContainerStyle={{
          ...colonne,
          paddingBottom: espace.espace8 + marge + 52 + espace.espace4,
          gap: espace.espace6,
        }}>
        <View style={[styles.entete, { gap: espace.espace3 }]}>
          <View style={styles.enteteTexte}>
            <Text accessibilityRole="header" {...surTexte} style={[typographie.display, { color: couleurs.emeraude }]}>
              {t('budget.titre')}
            </Text>
            <Text {...surTexte} style={[corps14, { color: couleurs.encre3 }]}>
              {`${sousTitre} · `}
              <Text
                accessibilityRole="link"
                onPress={() => router.push('/budget/devise')}
                style={{ fontFamily: typographie.libelle.fontFamily, color: couleurs.emeraude }}>
                {devise.symbole}
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.pastille,
              { backgroundColor: couleurs.surfaceCreux, gap: espace.espace2, paddingHorizontal: espace.espace3 },
            ]}>
            <Icon name="lock" size={14} color={couleurs.encre2} />
            <Text {...surTexte} style={[typographie.legende, styles.gras, { color: couleurs.encre2 }]}>
              {t('budget.surTelephone')}
            </Text>
          </View>
        </View>
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
            backgroundColor: couleurs.emeraudeAplat,
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
        {verset ? <VersetRubrique verset={verset} /> : null}

        <View style={{ gap: espace.espace2 }}>
          <View
            accessible
            accessibilityLabel={`${t('budget.repartitionMois')} : ${t('budget.depense')} ${f(mois.depense)}, ${t('budget.epargne')} ${f(mois.misDeCote)}, ${t('budget.resteLegende')} ${f(reste)}`}
            style={[styles.barre, { backgroundColor: couleurs.surfaceCreux }]}>
            <View style={{ width: largeur(mois.depense), backgroundColor: couleurs.emeraudeAplat }} />
            <View style={{ width: largeur(mois.misDeCote), backgroundColor: couleurs.or }} />
          </View>
          <View style={styles.legende}>
            {[
              [t('budget.depense'), mois.depense, couleurs.emeraudeAplat, null],
              [t('budget.epargne'), mois.misDeCote, couleurs.or, null],
              [t('budget.resteLegende'), reste, couleurs.surfaceCreux, couleurs.ligneForte],
            ].map(([libelle, montant, fond, bord]) => (
              <View key={String(libelle)} style={[styles.legendeItem, { gap: espace.espace1 }]}>
                <View
                  style={[
                    styles.carre,
                    { backgroundColor: String(fond) },
                    bord ? { borderWidth: 1, borderColor: String(bord) } : null,
                  ]}
                />
                <Text
                  {...surTexte}
                  style={[typographie.legende, { color: couleurs.encre2, fontVariant: ['tabular-nums'] }]}>
                  {`${libelle} ${f(Number(montant))}`}
                </Text>
              </View>
            ))}
          </View>
          <Text {...surTexte} style={[typographie.legende, { color: couleurs.encre3 }]}>
            {t('budget.recuCeMois', { montant: f(mois.recu) })}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('dettes.titre')} : ${t('dettes.onMeDoit')} ${f(resume.onMeDoit)}, ${t('dettes.jeDois')} ${f(resume.jeDois)}`}
          android_ripple={{ color: couleurs.emeraudeDoux }}
          onPress={() => router.push('/budget/dettes')}
          style={({ pressed }) => [
            styles.carteDettes,
            {
              gap: espace.espace3,
              paddingVertical: espace.espace3,
              paddingHorizontal: espace.espace4,
              borderRadius: rayon.rayonCarte,
              backgroundColor: couleurs.surface,
              borderColor: couleurs.ligne,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <View style={{ flex: 1, gap: espace.espace1 }}>
            <Text {...surTexte} style={[typographie.corps, styles.gras, { color: couleurs.encre }]}>
              {t('dettes.titre')}
            </Text>
            <Text {...surTexte} style={[corps14, { color: couleurs.encre3, fontVariant: ['tabular-nums'] }]}>
              {`${t('dettes.onMeDoit')} ${f(resume.onMeDoit)} · ${t('dettes.jeDois')} ${f(resume.jeDois)}`}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={couleurs.encre3} />
        </Pressable>

        {/* Charte : 32 avant un titre de section = 24 du bloc + 8. */}
        <View style={{ marginTop: espace.espace2 }}>
          <View style={styles.titreEnveloppes}>
            <Text accessibilityRole="header" {...surTexte} style={[typographie.titre3, { color: couleurs.encre }]}>
              {t('budget.enveloppes')}
            </Text>
            {nonReparti(mois) > 0 ? (
              <Text {...surTexte} style={[corps14, { color: couleurs.encre3 }]}>
                {t('budget.nonRepartiMontant', { montant: f(nonReparti(mois)) })}
              </Text>
            ) : null}
          </View>
          {mois.enveloppes.map((e) => (
            <Envelope
              key={e.id}
              nom={e.nom}
              depense={e.depense}
              plafond={e.plafond}
              fixe={e.fixe}
              devise={devise}
              onPress={() => router.push({ pathname: '/budget/enveloppe/[id]', params: { id: e.id } })}
            />
          ))}
        </View>

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
        </ListGroup>

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('budget.ajouterDepense')}
        android_ripple={{ color: couleurs.emeraudeDoux, foreground: true }}
        onPress={() => router.push('/budget-ajout')}
        style={({ pressed }) => [
          styles.flottant,
          {
            end: espace.espace5,
            bottom: dessous + espace.espace4,
            gap: espace.espace2,
            paddingHorizontal: espace.espace5,
            shadowColor: couleurs.encre,
            backgroundColor: couleurs.emeraudeAplat,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <Icon name="plus" size={20} color={couleurs.surEmeraude} />
        <Text {...surTexte} style={[typographie.corps, styles.gras, { color: couleurs.surEmeraude }]}>
          {t('budget.depenseCourt')}
        </Text>
      </Pressable>

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
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  enteteTexte: { flex: 1 },
  pastille: { flexDirection: 'row', alignItems: 'center', height: 32, borderRadius: rayon.rayonPastille },
  gras: { fontFamily: 'SourceSans3_600SemiBold' },
  barre: { flexDirection: 'row', height: 12, borderRadius: rayon.rayonPastille, overflow: 'hidden' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: espace.espace1 },
  legendeItem: { flexDirection: 'row', alignItems: 'center' },
  carre: { width: 8, height: 8, borderRadius: 2 },
  carteDettes: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  titreEnveloppes: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: espace.espace1 },
  flottant: {
    position: 'absolute',
    height: 52,
    borderRadius: rayon.rayonPastille,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
