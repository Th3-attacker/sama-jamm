import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ecouter } from '@/features/ecouter/lecteur';
import {
  CATEGORIES,
  estCategorie,
  invocationsDe,
  type CategorieId,
  type Invocation,
} from '@/features/invocations/donnees';
import { BarreCompteur } from '@/features/invocations/BarreCompteur';
import { useTaillesLecture } from '@/features/lire/BarreTaille';
import { sourate, traductionDe, translitDe, versetsDe } from '@/features/lire/coran';
import { marqueur } from '@/features/lire/PageMushaf';
import { PartageVerset, type VersetAPartager } from '@/features/lire/PartageVerset';
import { TranslitVerset } from '@/features/lire/TranslitVerset';
import { useParametre } from '@/hooks/useParametre';
import { cleJour } from '@/lib/dates';
import { vibrerLeger } from '@/lib/haptique';
import { cleVerset, useFavoris } from '@/stores/favoris';
import { useLecture } from '@/stores/lecture';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { ProgressBar } from '@/ui/ProgressBar';
import { TopBar } from '@/ui/TopBar';
import { useToast } from '@/ui/Toast';

/** Un jour de lecture est compté après ce délai à l'écran, comme pour le Coran. */
const SECONDES_POUR_UN_JOUR = 30;

const TITRES = { matin: 'invocations.titreMatin', soir: 'invocations.titreSoir', sommeil: 'invocations.titreSommeil' } as const;

type Contenu = { n: number; arabe: string; trad: string; translit: string };

function contenuDe(inv: Invocation): Contenu[] {
  const arabes = versetsDe(inv.sourate);
  const trads = traductionDe(inv.sourate);
  const translits = translitDe(inv.sourate);
  return Array.from({ length: inv.a - inv.de + 1 }, (_, k) => {
    const n = inv.de + k;
    return { n, arabe: arabes[n - 1] ?? '', trad: trads[n - 1] ?? '', translit: translits[n - 1] ?? '' };
  });
}

/** Invocations d'un moment de la journée : moments en puces, avancée, cartes de lecture, compteur fixé en bas. */
export default function EcranInvocations() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const brut = useParametre('categorie');
  const marquerJour = useLecture((s) => s.marquerJour);

  useEffect(() => {
    const minuteur = setTimeout(() => marquerJour(cleJour(new Date())), SECONDES_POUR_UN_JOUR * 1000);
    return () => clearTimeout(minuteur);
  }, [marquerJour]);

  if (!estCategorie(brut)) {
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
  return <Moments initiale={brut} />;
}

function Moments({ initiale }: { initiale: CategorieId }) {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const { afficher } = useToast();
  const [categorie, setCategorie] = useState<CategorieId>(initiale);
  const [comptes, setComptes] = useState<Record<string, number>>({});
  const [choisi, setChoisi] = useState<string | null>(null);
  const [aPartager, setAPartager] = useState<VersetAPartager | null>(null);
  const favoris = useFavoris((s) => s.versets);
  const basculerFavori = useFavoris((s) => s.basculer);

  const liste = useMemo(() => invocationsDe(categorie), [categorie]);
  const fait = (i: Invocation, c: Record<string, number> = comptes) => (c[i.id] ?? 0) >= i.repetitions;
  const actif = liste.find((i) => i.id === choisi) ?? liste.find((i) => !fait(i)) ?? liste[0];
  const nbFaites = liste.filter((i) => fait(i)).length;

  const changerMoment = (c: CategorieId) => {
    setCategorie(c);
    setChoisi(null);
  };

  // Un toucher compte une lecture ; la dernière passe à l'invocation suivante, un toucher de plus recommence.
  const compter = () => {
    if (!actif) return;
    vibrerLeger();
    const avant = comptes[actif.id] ?? 0;
    const apres = avant >= actif.repetitions ? 0 : avant + 1;
    const suite = { ...comptes, [actif.id]: apres };
    setComptes(suite);
    if (apres >= actif.repetitions) {
      const prochaine = liste.find((i) => i.id !== actif.id && !fait(i, suite));
      if (prochaine) setChoisi(prochaine.id);
    }
  };

  const libelleActif = actif ? (contenuDe(actif)[0]?.translit ?? '').replace(/<[^>]*>/g, '').split(' ').slice(0, 2).join(' ') : '';

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('lire.invocations')} sousTitre={t('invocations.sousTitre')} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace6, gap: espace.espace4 }}>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('invocations.moments')} style={[styles.puces, { gap: espace.espace2 }]}>
          {CATEGORIES.map((c) => (
            <Chip key={c} selectionne={c === categorie} onPress={() => changerMoment(c)}>
              {t(`invocations.${c}`)}
            </Chip>
          ))}
        </View>
        <ProgressBar
          valeur={liste.length ? nbFaites / liste.length : 0}
          label={t(TITRES[categorie])}
          detail={t('invocations.progression', { n: nbFaites, total: liste.length })}
          ton="or"
        />
        {liste.map((inv) => {
          const contenu = contenuDe(inv);
          const meta = sourate(inv.sourate);
          const ref = `${meta?.nom ?? ''} ${inv.sourate}:${inv.de}${inv.a > inv.de ? `-${inv.a}` : ''}`;
          const premier = contenu[0];
          const cle = cleVerset(inv.sourate, inv.de);
          const favori = favoris.includes(cle);
          return (
            <CarteInvocation
              key={inv.id}
              source={t('invocations.sourceCoran', { ref, fois: t('invocations.fois', { count: inv.repetitions }) })}
              contenu={contenu}
              actif={inv.id === actif?.id}
              termine={fait(inv)}
              favori={favori}
              onChoisir={() => setChoisi(inv.id)}
              onEcouter={() => {
                ecouter({ sourate: inv.sourate, verset: inv.de });
                router.push('/lecteur');
              }}
              onFavori={() => {
                if (basculerFavori(inv.sourate, inv.de)) afficher({ texte: t('lire.favoriAjoute'), icone: 'check' });
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
          );
        })}
        <Banner ton="info">{t('invocations.note')}</Banner>
      </ScrollView>

      {actif ? (
        <BarreCompteur titre={libelleActif} n={comptes[actif.id] ?? 0} total={actif.repetitions} onCompter={compter} />
      ) : null}
      <PartageVerset verset={aPartager} onFermer={() => setAPartager(null)} />
    </View>
  );
}

type CarteProps = {
  source: string;
  contenu: Contenu[];
  actif: boolean;
  termine: boolean;
  favori: boolean;
  onChoisir: () => void;
  onEcouter: () => void;
  onFavori: () => void;
  onPartager: () => void;
};

function CarteInvocation({ source, contenu, actif, termine, favori, onChoisir, onEcouter, onFavori, onPartager }: CarteProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const affichage = useReglages((s) => s.affichage);
  const translitActive = useReglages((s) => s.translitLecture);

  return (
    <View
      style={{
        backgroundColor: couleurs.surface,
        borderColor: actif ? couleurs.emeraude : couleurs.ligne,
        borderWidth: actif ? 2 : 1,
        borderRadius: rayon.rayonCarte,
      }}>
      <Pressable accessibilityRole="button" onPress={onChoisir} style={{ padding: espace.espace4, gap: espace.espace3 }}>
        <View style={styles.sourceLigne}>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.legende, { color: couleurs.encre3, flex: 1 }]}>
            {source}
          </Text>
          {termine ? <Icon name="check-circle" size={20} color={couleurs.emeraude} /> : null}
        </View>
        {affichage !== 'tradSeule' ? (
          <Text
            accessibilityLanguage="ar"
            maxFontSizeMultiplier={echelleMax.grand}
            style={[typographie.coran, tailleArabe, styles.arabe, { color: couleurs.encre }]}>
            {contenu.map((v) => `${v.arabe} ${marqueur(v.n)}`).join(' ')}
          </Text>
        ) : null}
        {affichage !== 'tradSeule' && translitActive
          ? contenu.map((v) => (v.translit ? <TranslitVerset key={v.n} texte={v.translit} taille={tailleTrad} /> : null))
          : null}
        {affichage !== 'arabeSeul' ? (
          <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.lecture, tailleTrad, { color: couleurs.encre2 }]}>
            {contenu.map((v) => v.trad).join(' ')}
          </Text>
        ) : null}
      </Pressable>
      <View style={[styles.actions, { borderTopColor: couleurs.ligne, paddingHorizontal: espace.espace4, paddingVertical: espace.espace2 }]}>
        <Pressable accessibilityRole="button" onPress={onEcouter} style={[styles.ecouter, { gap: espace.espace2 }]}>
          <Icon name="play" size={16} color={couleurs.emeraude} />
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.emeraude }]}>
            {t('commun.ecouter')}
          </Text>
        </Pressable>
        <View style={styles.sortie}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(favori ? 'lire.favoriRetirer' : 'lire.favoriAjouter')}
            accessibilityState={{ selected: favori }}
            hitSlop={8}
            onPress={onFavori}
            style={styles.icone}>
            <Icon name="bookmark" size={20} color={favori ? couleurs.emeraude : couleurs.encre2} filled={favori} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('partage.titre')} hitSlop={8} onPress={onPartager} style={styles.icone}>
            <Icon name="share" size={20} color={couleurs.encre2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
  sourceLigne: { flexDirection: 'row', alignItems: 'center' },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  ecouter: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  sortie: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  icone: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
