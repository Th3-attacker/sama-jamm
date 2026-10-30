import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { appliquerSensEtRedemarrer, demandeRedemarrage } from '@/features/bienvenue/sensDeLecture';
import { estLangue, langues, type Langue } from '@/i18n/langues';
import { useReglages } from '@/stores/reglages';
import { useTheme } from '@/theme/useTheme';
import type { ChoixTheme } from '@/theme/veille';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Dialog } from '@/ui/Dialog';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { RadioGroup } from '@/ui/RadioGroup';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Switch } from '@/ui/Switch';
import { TopBar } from '@/ui/TopBar';

// Noms des langues dans leur propre langue : ils ne se traduisent pas.
const NOMS_LANGUES: Record<Langue, string> = { wo: 'Wolof', fr: 'Français', ar: 'العربية' };
const THEMES: readonly ChoixTheme[] = ['auto', 'jour', 'nuit', 'veille'];

export default function Reglages() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace } = useTheme();
  const theme = useReglages((s) => s.theme);
  const veilleAuto = useReglages((s) => s.veilleAuto);
  const haptique = useReglages((s) => s.haptique);
  const methode = useReglages((s) => s.methode);
  const langueEnregistree = useReglages((s) => s.langue);
  const definirTheme = useReglages((s) => s.definirTheme);
  const definirVeilleAuto = useReglages((s) => s.definirVeilleAuto);
  const definirHaptique = useReglages((s) => s.definirHaptique);
  const definirLangue = useReglages((s) => s.definirLangue);
  const definirTraduction = useReglages((s) => s.definirTraduction);
  const [feuilleLangue, setFeuilleLangue] = useState(false);
  const [aRedemarrer, setARedemarrer] = useState<Langue | null>(null);
  const [redemarrageManuel, setRedemarrageManuel] = useState(false);

  const langue: Langue = langueEnregistree ?? (estLangue(i18n.language) ? i18n.language : 'fr');

  const appliquerLangue = (choix: Langue) => {
    definirLangue(choix);
    // La traduction du Coran suit la langue ; en interface arabe, le français par défaut.
    definirTraduction(choix === 'ar' ? 'fr' : choix);
  };

  const choisirLangue = (id: string) => {
    if (!estLangue(id) || id === langue) {
      setFeuilleLangue(false);
      return;
    }
    setFeuilleLangue(false);
    if (demandeRedemarrage(id)) setARedemarrer(id);
    else appliquerLangue(id);
  };

  const redemarrer = (choix: Langue) => {
    setARedemarrer(null);
    appliquerLangue(choix);
    appliquerSensEtRedemarrer(choix)
      .then((ok) => {
        if (!ok) setRedemarrageManuel(true);
      })
      .catch((erreur: unknown) => {
        console.error('Changement de sens de lecture impossible', erreur);
        setRedemarrageManuel(true);
      });
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('reglages.titre')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace6 }}>
        {redemarrageManuel ? <Banner ton="info">{t('bienvenue.redemarrerManuel')}</Banner> : null}

        <View style={{ gap: espace.espace3 }}>
          <SegmentedControl
            label={t('reglages.theme')}
            options={THEMES.map((id) => ({ id, label: t(`reglages.themes.${id}`) }))}
            valeur={theme}
            onChange={(id) => {
              const choix = THEMES.find((x) => x === id);
              if (choix) definirTheme(choix);
            }}
          />
          <ListGroup titre={t('reglages.apparence')}>
            <ListItem
              icone="moon"
              titre={t('reglages.veilleAuto')}
              // Un thème choisi à la main l'emporte sur la Veille automatique.
              sousTitre={theme === 'auto' ? t('reglages.veilleAutoDetail') : t('reglages.veilleSiAuto')}
              droite={<Switch label={t('reglages.veilleAuto')} active={veilleAuto} disabled={theme !== 'auto'} onChange={definirVeilleAuto} />}
            />
            <ListItem
              icone="bolt"
              titre={t('reglages.haptique')}
              droite={<Switch label={t('reglages.haptique')} active={haptique} onChange={definirHaptique} />}
            />
          </ListGroup>
        </View>

        <ListGroup titre={t('reglages.lecture')}>
          <ListItem icone="globe" titre={t('reglages.langueApp')} valeur={NOMS_LANGUES[langue]} onPress={() => setFeuilleLangue(true)} />
        </ListGroup>

        <ListGroup titre={t('reglages.priere')}>
          <ListItem titre={t('priere.methodeTitre')} valeur={t(`priere.methodes.${methode}`)} onPress={() => router.push('/priere/methode')} />
          <ListItem titre={t('priere.rappelsTitre')} onPress={() => router.push('/priere/rappels')} />
        </ListGroup>
      </ScrollView>

      <BottomSheet ouvert={feuilleLangue} titre={t('reglages.langueApp')} onFermer={() => setFeuilleLangue(false)}>
        <RadioGroup
          label={t('bienvenue.langueQuestion')}
          encadre={false}
          options={langues.map((id) => ({ id, label: NOMS_LANGUES[id] }))}
          valeur={langue}
          onChange={choisirLangue}
        />
      </BottomSheet>

      <Dialog
        ouvert={aRedemarrer !== null}
        titre={t('bienvenue.redemarrer')}
        confirmer={t('bienvenue.redemarrer')}
        icone="globe"
        onConfirmer={() => {
          if (aRedemarrer) redemarrer(aRedemarrer);
        }}
        onAnnuler={() => setARedemarrer(null)}>
        {aRedemarrer === 'ar' ? t('bienvenue.langueRedemarrage') : t('bienvenue.langueRedemarrageLtr')}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
