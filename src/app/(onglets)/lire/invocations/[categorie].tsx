import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ecouter } from '@/features/ecouter/lecteur';
import { invocationsDe, type Invocation } from '@/features/invocations/donnees';
import { BarreCompteur } from '@/features/invocations/BarreCompteur';
import { CarteHisn } from '@/features/invocations/CarteHisn';
import { chapitresDeCategorie } from '@/features/invocations/categoriesHisn';
import { chapitresHisn, debutDe, titreDe } from '@/features/invocations/hisn';
import { estMoment, estMomentHisn, MOMENTS, MOMENTS_HISN, type MomentId } from '@/features/invocations/moments';
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

const TITRES = {
  matin: 'invocations.titreMatin',
  soir: 'invocations.titreSoir',
  sommeil: 'invocations.titreSommeil',
  voyage: 'invocations.titreVoyage',
  repas: 'invocations.titreRepas',
  apresPriere: 'invocations.titreApresPriere',
} as const;

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

  if (!estMoment(brut)) {
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

function Moments({ initiale }: { initiale: MomentId }) {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const [categorie, setCategorie] = useState<MomentId>(initiale);
  const [comptes, setComptes] = useState<Record<string, number>>({});
  const [choisi, setChoisi] = useState<string | null>(null);
  const [aPartager, setAPartager] = useState<VersetAPartager | null>(null);
  const favoris = useFavoris((s) => s.versets);
  const basculerFavori = useFavoris((s) => s.basculer);

  // Deux sources : des versets du Coran, ou les chapitres d'une catégorie de la citadelle. Dans les deux cas,
  // le compteur suit une suite d'« entrées » repérées par une clé.
  const liste = useMemo<Invocation[]>(() => (estMomentHisn(categorie) ? [] : invocationsDe(categorie)), [categorie]);
  const groupesHisn = useMemo(
    () => (estMomentHisn(categorie) ? chapitresDeCategorie(MOMENTS_HISN[categorie], chapitresHisn()) : []),
    [categorie],
  );
  const entrees = useMemo(
    () =>
      estMomentHisn(categorie)
        ? groupesHisn.flatMap((c) =>
            c.items.map((it) => ({ cle: `${c.id}:${it.id}`, repetitions: it.repetitions, texte: it.texte })),
          )
        : liste.map((i) => ({ cle: i.id, repetitions: i.repetitions, texte: '' })),
    [categorie, groupesHisn, liste],
  );
  const fait = (cle: string, c: Record<string, number> = comptes) =>
    (c[cle] ?? 0) >= (entrees.find((e) => e.cle === cle)?.repetitions ?? 1);
  const actif = entrees.find((e) => e.cle === choisi) ?? entrees.find((e) => !fait(e.cle)) ?? entrees[0];
  const nbFaites = entrees.filter((e) => fait(e.cle)).length;

  const changerMoment = (c: MomentId) => {
    setCategorie(c);
    setChoisi(null);
  };

  // Un toucher compte une lecture ; la dernière passe à l'invocation suivante, un toucher de plus recommence.
  const compter = () => {
    if (!actif) return;
    vibrerLeger();
    const avant = comptes[actif.cle] ?? 0;
    const apres = avant >= actif.repetitions ? 0 : avant + 1;
    const suite = { ...comptes, [actif.cle]: apres };
    setComptes(suite);
    if (apres >= actif.repetitions) {
      const prochaine = entrees.find((e) => e.cle !== actif.cle && !fait(e.cle, suite));
      if (prochaine) setChoisi(prochaine.cle);
    }
  };

  const invActive = liste.find((i) => i.id === actif?.cle);
  const libelleActif = actif
    ? invActive
      ? (contenuDe(invActive)[0]?.translit ?? '').replace(/<[^>]*>/g, '').split(' ').slice(0, 2).join(' ')
      : debutDe(actif.texte)
    : '';

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('lire.invocations')} sousTitre={t('invocations.sousTitre')} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace6, gap: espace.espace4 }}>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('invocations.moments')} style={[styles.puces, { gap: espace.espace2 }]}>
          {MOMENTS.map((c) => (
            <Chip key={c} selectionne={c === categorie} onPress={() => changerMoment(c)}>
              {t(`invocations.${c}`)}
            </Chip>
          ))}
        </View>
        <ProgressBar
          valeur={entrees.length ? nbFaites / entrees.length : 0}
          label={t(TITRES[categorie])}
          detail={t('invocations.progression', { n: nbFaites, total: entrees.length })}
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
              actif={inv.id === actif?.cle}
              termine={fait(inv.id)}
              favori={favori}
              onChoisir={() => setChoisi(inv.id)}
              onEcouter={() => {
                ecouter({ sourate: inv.sourate, verset: inv.de });
                router.push('/ecouter/lecteur');
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
        {groupesHisn.map((c) => (
          <View key={c.id} style={{ gap: espace.espace3 }}>
            <Text
              accessibilityRole="header"
              accessibilityLanguage={i18n.language === 'ar' ? 'ar' : undefined}
              maxFontSizeMultiplier={echelleMax.grand}
              style={[typographie.titre3, { color: couleurs.emeraude }]}>
              {titreDe(c, i18n.language)}
            </Text>
            {c.items.map((it) => {
              const cle = `${c.id}:${it.id}`;
              return (
                <CarteHisn
                  key={cle}
                  item={it}
                  actif={cle === actif?.cle}
                  termine={fait(cle)}
                  onChoisir={() => setChoisi(cle)}
                />
              );
            })}
          </View>
        ))}
        <Banner ton="info">{t(estMomentHisn(categorie) ? 'invocations.noteHisn' : 'invocations.note')}</Banner>
      </ScrollView>

      {actif ? (
        <BarreCompteur
          titre={libelleActif}
          arabe={!invActive}
          n={comptes[actif.cle] ?? 0}
          total={actif.repetitions}
          onCompter={compter}
        />
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
