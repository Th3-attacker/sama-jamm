import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ecouter } from '@/features/ecouter/lecteur';
import { estCategorie, invocationsDe, type CategorieId, type Invocation } from '@/features/invocations/donnees';
import { BarreCompteur } from '@/features/invocations/BarreCompteur';
import { CarteInvocation, contenuDe, referenceDe } from '@/features/invocations/CarteInvocation';
import { sourate } from '@/features/lire/coran';
import { PartageVerset, type VersetAPartager } from '@/features/lire/PartageVerset';
import { useParametre } from '@/hooks/useParametre';
import { cleJour } from '@/lib/dates';
import { vibrerLeger } from '@/lib/haptique';
import { cleVerset, useFavoris } from '@/stores/favoris';
import { useComptesDuJour, useInvocationsJour } from '@/stores/invocationsJour';
import { useLecture } from '@/stores/lecture';
import { usePleinEcran } from '@/stores/pleinEcran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { TopBar } from '@/ui/TopBar';
import { useToast } from '@/ui/Toast';

/** Un jour de lecture est compté après ce délai à l'écran, comme pour le Coran. */
const SECONDES_POUR_UN_JOUR = 30;

/** Lecture d'une invocation d'un moment : carte du texte, compteur fixé en bas. */
export default function EcranLectureInvocation() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const categorie = useParametre('categorie');
  const id = useParametre('invocation');
  const marquerJour = useLecture((s) => s.marquerJour);

  useEffect(() => {
    const minuteur = setTimeout(() => marquerJour(cleJour(new Date())), SECONDES_POUR_UN_JOUR * 1000);
    return () => clearTimeout(minuteur);
  }, [marquerJour]);

  const inv = estCategorie(categorie) ? invocationsDe(categorie).find((i) => i.id === id) : undefined;
  if (!inv || !estCategorie(categorie)) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('lire.invocations')} />
        <View style={{ paddingHorizontal: espace.espace5 }}>
          <Banner ton="erreur" titre={t('etats.erreurTitre')}>
            {t('etats.erreurTexte')}
          </Banner>
        </View>
      </View>
    );
  }
  return <Lecture inv={inv} categorie={categorie} liste={invocationsDe(categorie)} />;
}

function Lecture({ inv, categorie, liste }: { inv: Invocation; categorie: CategorieId; liste: Invocation[] }) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const [aPartager, setAPartager] = useState<VersetAPartager | null>(null);
  // Tout le moment est fini : l'écran « Terminé » remplace la lecture.
  const [termine, setTermine] = useState(false);
  // Lecture sans la barre d'onglets, comme la page du Coran.
  useEffect(() => {
    usePleinEcran.setState({ actif: true });
    return () => usePleinEcran.setState({ actif: false });
  }, []);
  const favoris = useFavoris((s) => s.versets);
  const basculerFavori = useFavoris((s) => s.basculer);
  const comptes = useComptesDuJour();
  const definir = useInvocationsJour((s) => s.definir);

  const contenu = contenuDe(inv);
  const meta = sourate(inv.sourate);
  const premier = contenu[0];
  const favori = favoris.includes(cleVerset(inv.sourate, inv.de));
  const n = comptes[inv.id] ?? 0;
  const libelle = (premier?.translit ?? '').replace(/<[^>]*>/g, '').split(' ').slice(0, 2).join(' ');

  // Un toucher compte une lecture ; la dernière passe à l'invocation suivante, un toucher de plus recommence.
  const compter = () => {
    vibrerLeger();
    const apres = n >= inv.repetitions ? 0 : n + 1;
    definir(inv.id, apres);
    if (apres >= inv.repetitions) {
      const prochaine = liste.find((i) => i.id !== inv.id && (comptes[i.id] ?? 0) < i.repetitions);
      if (prochaine) router.setParams({ invocation: prochaine.id });
      else setTermine(true);
    }
  };

  const index = liste.findIndex((i) => i.id === inv.id);
  const aller = (i: Invocation | undefined) => {
    if (i) router.setParams({ invocation: i.id });
  };
  const sourceTexte = t('invocations.sourceCoran', { ref: referenceDe(inv), fois: t('invocations.fois', { count: inv.repetitions }) });

  if (termine) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t(`invocations.${categorie}`)} />
        <View style={[styles.fin, { padding: espace.espace6, gap: espace.espace4 }]}>
          <Icon name="check-circle" size={56} color={couleurs.emeraude} />
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, styles.texteFin, { color: couleurs.emeraude }]}>
            {t('invocations.terminee')}
          </Text>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.texteFin, { color: couleurs.encre2 }]}>
            {t('invocations.termineeMoment', { moment: t(`invocations.${categorie}`) })}
          </Text>
          <Button pleineLargeur onPress={() => router.back()}>
            {t('invocations.retourInvocations')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : le moment et « 3 sur 12 » au centre, le marque-page de l'invocation à droite. */}
      <TopBar
        retour
        gauche={
          <View style={styles.centre}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.titreCentre, { color: couleurs.encre }]}>
              {t(`invocations.${categorie}`)}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.compteCentre, { color: couleurs.encre2 }]}>
              {t('invocations.progression', { n: index + 1, total: liste.length })}
            </Text>
          </View>
        }
        actions={[
          {
            icone: 'bookmark',
            label: t(favori ? 'lire.favoriRetirer' : 'lire.favoriAjouter'),
            actif: favori,
            couleur: couleurs.orTexte,
            onPress: () => {
              if (basculerFavori(inv.sourate, inv.de)) afficher({ texte: t('lire.favoriAjoute'), icone: 'check' });
            },
          },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace6, gap: espace.espace4 }}>
        {/* Une barre par invocation : faite en émeraude, en cours en or. */}
        <View accessible accessibilityRole="progressbar" accessibilityLabel={t(`invocations.${categorie}`)} accessibilityValue={{ text: t('invocations.progression', { n: index + 1, total: liste.length }) }} style={[styles.segments, { gap: espace.espace1 }]}>
          {liste.map((i, k) => (
            <View
              key={i.id}
              style={[
                styles.segment,
                { backgroundColor: k === index ? couleurs.or : (comptes[i.id] ?? 0) >= i.repetitions ? couleurs.emeraude : couleurs.ligneForte },
              ]}
            />
          ))}
        </View>
        <CarteInvocation
          source={sourceTexte}
          contenu={contenu}
          termine={n >= inv.repetitions}
          onChoisir={compter}
          onEcouter={() => {
            ecouter({ sourate: inv.sourate, verset: inv.de });
            router.navigate('/lecteur');
          }}
          onPartager={() => {
            if (premier && meta)
              setAPartager({
                sourate: inv.sourate,
                nomSourate: meta.nom,
                n: inv.de,
                texte: contenu.map((v) => v.arabe).join(' '),
                trad: contenu.map((v) => v.trad).join(' '),
              });
          }}
        />
        <Banner ton="info">{t('invocations.note')}</Banner>
      </ScrollView>
      <BarreCompteur
        titre={libelle}
        n={n}
        total={inv.repetitions}
        onCompter={compter}
        onPrecedent={() => aller(liste[index - 1])}
        onSuivant={() => aller(liste[index + 1])}
        sansPrecedent={index <= 0}
        sansSuivant={index >= liste.length - 1}
      />
      <PartageVerset verset={aPartager} onFermer={() => setAPartager(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  centre: { alignSelf: 'stretch', alignItems: 'center' },
  titreCentre: { fontSize: 16, lineHeight: 24 },
  compteCentre: { fontSize: 14, lineHeight: 20 },
  fin: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texteFin: { textAlign: 'center' },
  segments: { flexDirection: 'row' },
  segment: { flex: 1, height: 4, borderRadius: 2 },
});
