import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import type { Carnet, Depot, FiltreHistorique, OperationHistorique } from '@/features/budget/depot';
import { iconeEnveloppe } from '@/features/budget/enveloppesDeDepart';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { cleJour, formatJourCle } from '@/lib/dates';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { LigneBalayable } from '@/ui/LigneBalayable';
import { ListItem } from '@/ui/ListItem';
import { useToast } from '@/ui/Toast';
import { EnteteRetour } from '@/ui/EnteteRetour';
import { ListGroup } from '@/ui/ListGroup';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, tailles } from '@/theme/tokens.generated';
const FILTRES: readonly FiltreHistorique[] = ['tout', 'depenses', 'revenus'];
/** Planche « MajGesteBudget » : une suppression se défait pendant 5 secondes. */
const DELAI_ANNULATION = 5000;
const PAUSE_ACTUALISATION = 600;

/** Toutes les opérations du cycle, groupées par jour ; toucher une opération ouvre sa correction. */
export default function Historique() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie, ligne } = useTheme();
  const marge = useMargeBasse();
  const insets = useSafeAreaInsets();
  const { afficher } = useToast();
  const [filtre, setFiltre] = useState<FiltreHistorique>('tout');
  const etat = useBudget((depot, carnet) => depot.historique(carnet, filtre), filtre);
  const [actualisation, setActualisation] = useState(false);
  // Suppressions en attente : la ligne disparaît tout de suite, la base n'est touchée qu'après DELAI_ANNULATION.
  const [masquees, setMasquees] = useState<ReadonlySet<string>>(new Set());
  const enAttente = useRef(new Map<string, { minuterie: ReturnType<typeof setTimeout>; valider: () => Promise<void> }>());

  // En quittant l'écran, les suppressions annonçables sont confirmées (rien n'est perdu ni laissé à moitié).
  useEffect(() => {
    const attentes = enAttente.current;
    return () => {
      attentes.forEach(({ minuterie, valider }) => {
        clearTimeout(minuterie);
        valider().catch((erreur: unknown) => console.error('Opération non supprimée', erreur));
      });
      attentes.clear();
    };
  }, []);

  const retirerMasque = useCallback((id: string) => {
    setMasquees((m) => {
      const suite = new Set(m);
      suite.delete(id);
      return suite;
    });
  }, []);

  const supprimerAvecAnnulation = useCallback(
    (depot: Depot, carnet: Carnet, id: string) => {
      setMasquees((m) => new Set(m).add(id));
      const valider = async () => {
        enAttente.current.delete(id);
        try {
          await depot.supprimerOperation(carnet, id);
          budgetModifie();
        } catch (erreur: unknown) {
          console.error('Opération non supprimée', erreur);
          retirerMasque(id);
          afficher({ texte: t('etats.erreurTexte'), icone: 'alert' });
        }
      };
      const minuterie = setTimeout(() => {
        valider().catch((erreur: unknown) => console.error('Opération non supprimée', erreur));
      }, DELAI_ANNULATION);
      enAttente.current.set(id, { minuterie, valider });
      afficher({
        texte: t('budget.operationSupprimee'),
        icone: 'trash',
        duree: DELAI_ANNULATION,
        action: {
          label: t('commun.annuler'),
          onPress: () => {
            const attente = enAttente.current.get(id);
            if (!attente) return;
            clearTimeout(attente.minuterie);
            enAttente.current.delete(id);
            retirerMasque(id);
          },
        },
      });
    },
    [afficher, retirerMasque, t],
  );

  const actualiser = () => {
    setActualisation(true);
    budgetModifie();
    setTimeout(() => setActualisation(false), PAUSE_ACTUALISATION);
  };

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('budget.historique')} etat={etat} />;
  }

  const devise = etat.carnet.devise;
  const aujourdhui = cleJour(new Date());
  // Un groupe par jour, dans l'ordre déjà trié (le plus récent d'abord) ; chaque groupe est une seule carte.
  const sections: { titre: string; total: number; data: [OperationHistorique[]] }[] = [];
  let courant: { jour: string; ops: OperationHistorique[] } | null = null;
  for (const o of etat.donnees.operations.filter((x) => !masquees.has(x.id))) {
    if (courant && courant.jour === o.date) {
      courant.ops.push(o);
      continue;
    }
    const ops: OperationHistorique[] = [o];
    courant = { jour: o.date, ops };
    const jourTexte = formatJourCle(o.date, i18n.language);
    sections.push({
      titre: o.date === aujourdhui ? `${t('budget.aujourdhui')} · ${jourTexte}` : jourTexte,
      total: 0,
      data: [ops],
    });
  }
  // Total du jour : revenus moins dépenses (l'épargne et les virements ne bougent pas le reste).
  for (const section of sections) {
    section.total = section.data[0].reduce(
      (somme, o) => somme + (o.type === 'revenu' ? o.montant : o.type === 'depense' ? -o.montant : 0),
      0,
    );
  }
  const signe = (m: number) => `${m > 0 ? '+' : m < 0 ? '− ' : ''}${m > 0 ? ' ' : ''}${formatMontant(Math.abs(m), devise)}`;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <SectionList
        sections={sections}
        keyExtractor={(_, i) => String(i)}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={actualisation} onRefresh={actualiser} />}
        ListHeaderComponent={
          <View style={{ gap: espace.espace4, paddingBottom: espace.espace2 }}>
            <EnteteRetour
              titre={t('budget.historique')}
              sousTitre={t('budget.cycle', {
                debut: formatJourCle(etat.donnees.cycle.debut, i18n.language),
                fin: formatJourCle(etat.donnees.cycle.fin, i18n.language),
              })}
              italique
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espace.espace2, paddingEnd: espace.espace5 }}>
              {FILTRES.map((f) => (
                <Chip key={f} selectionne={f === filtre} onPress={() => setFiltre(f)}>
                  {t(`budget.filtres.${f}`)}
                </Chip>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icone="list" titre={t('formules.serenite')} texte={filtre === 'tout' ? t('budget.historiqueVide') : t('budget.historiqueFiltreVide')} />
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.jour, { paddingTop: espace.espace4, paddingBottom: espace.espace2, paddingHorizontal: espace.espace1 }]}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, styles.jourTitre, { color: couleurs.encre2 }]}>
              {section.titre}
            </Text>
            {section.total !== 0 ? (
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.corps, ligne(styles.jourTotal), { color: couleurs.encre3 }]}>
                {signe(section.total)}
              </Text>
            ) : null}
          </View>
        )}
        renderItem={({ item: ops }) => (
          <ListGroup>
            {ops.map((o) => {
              const revenu = o.type === 'revenu';
              // Libellé de la sorte d'opération : l'enveloppe pour une dépense, sinon un mot.
              const sorte =
                o.type === 'depense'
                  ? o.enveloppe
                  : o.type === 'revenu'
                    ? t('budget.recu')
                    : o.type === 'epargne'
                      ? t('budget.epargneOperation')
                      : o.type === 'sadaqa'
                        ? t('budget.sadaqaOperation')
                        : t('budget.virementOperation');
              const valeur =
                o.type === 'revenu'
                  ? signe(o.montant)
                  : o.type === 'depense'
                    ? signe(-o.montant)
                    : formatMontant(o.montant, devise);
              const modifiable = o.type === 'depense' || o.type === 'revenu';
              const modifier = () => router.push({ pathname: '/budget/operation/[id]', params: { id: o.id } });
              const contenuLigne = (
                <ListItem
                  key={o.id}
                  icone={
                    revenu
                      ? 'wallet'
                      : o.type === 'depense'
                        ? iconeEnveloppe(o.icone ?? '')
                        : o.type === 'virement'
                          ? 'repeat'
                          : o.type === 'epargne'
                            ? 'target'
                            : 'heart'
                  }
                  ton={revenu ? 'emeraude' : o.type === 'epargne' || o.type === 'sadaqa' ? 'or' : 'neutre'}
                  titre={o.note ?? sorte ?? t('budget.recu')}
                  sousTitre={[sorte, o.compte].filter(Boolean).join(' · ')}
                  valeur={valeur}
                  onPress={modifier}
                  actionsAccessibilite={
                    modifiable
                      ? [
                          { name: 'modifier', label: t('commun.modifier') },
                          { name: 'supprimer', label: t('commun.supprimer') },
                        ]
                      : undefined
                  }
                  onActionAccessibilite={(e) => {
                    if (e.nativeEvent.actionName === 'modifier') modifier();
                    else if (e.nativeEvent.actionName === 'supprimer') supprimerAvecAnnulation(etat.depot, etat.carnet, o.id);
                  }}
                />
              );
              // Planche : balayer une dépense ou un revenu pour modifier ou supprimer (épargne et virements : seulement toucher).
              return modifiable ? (
                <LigneBalayable
                  key={o.id}
                  actions={[
                    { nom: 'modifier', label: t('commun.modifier'), icone: 'edit', ton: 'alerte', onPress: modifier },
                    { nom: 'supprimer', label: t('commun.supprimer'), icone: 'trash', ton: 'erreur', onPress: () => supprimerAvecAnnulation(etat.depot, etat.carnet, o.id) },
                  ]}>
                  {contenuLigne}
                </LigneBalayable>
              ) : (
                contenuLigne
              );
            })}
          </ListGroup>
        )}
        contentContainerStyle={{
          paddingHorizontal: espace.espace6,
          paddingTop: insets.top + espace.espace2,
          paddingBottom: espace.espace8 + marge,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  jour: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  jourTitre: { flex: 1 },
  jourTotal: { fontSize: tailles.t14, lineHeight: interlignes.l20, fontVariant: ['tabular-nums'] },
});
