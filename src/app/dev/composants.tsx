// Galerie des composants, en développement seulement. Textes d'exemple en dur : outil interne, jamais livré.
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { PageDots } from '@/ui/PageDots';
import { RadioGroup } from '@/ui/RadioGroup';
import { SearchField } from '@/ui/SearchField';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Switch } from '@/ui/Switch';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';
import type { IconName } from '@/ui/types';

const ICONES: IconName[] = [
  'play', 'pause', 'skip-back', 'skip-forward', 'repeat', 'bookmark', 'share', 'search', 'home', 'book',
  'headphones', 'clock', 'download', 'reset', 'wallet', 'bell', 'arrow-left', 'arrow-down', 'arrow-up',
  'chevron-right', 'chevron-down', 'more', 'check', 'close', 'plus', 'minus', 'backspace', 'info', 'alert',
  'offline', 'moon', 'sun', 'globe', 'trash', 'edit', 'compass', 'pin', 'settings', 'user', 'users', 'lock',
  'calendar', 'target', 'heart', 'balance', 'list', 'type', 'bolt', 'car', 'cart', 'copy', 'kaaba',
];

const rien = () => undefined;

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  const { couleurs, espace, typographie } = useTheme();
  return (
    <View style={{ gap: espace.espace3 }}>
      <Text style={[typographie.titre2, { color: couleurs.encre }]}>{titre}</Text>
      {children}
    </View>
  );
}

export default function Composants() {
  const { nom, couleurs, espace } = useTheme();
  const [veille, setVeille] = useState(true);
  const [segment, setSegment] = useState('auto');
  const [dialogue, setDialogue] = useState(false);
  const [feuille, setFeuille] = useState(false);
  const [recitateur, setRecitateur] = useState('alafasy');
  const [langue, setLangue] = useState('fr');
  const [recherche, setRecherche] = useState('');
  const { afficher } = useToast();

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <SafeAreaView style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <ScrollView contentContainerStyle={{ padding: espace.espace5, gap: espace.espace8 }}>
        <Text style={{ color: couleurs.encre3 }}>Thème : {nom}</Text>

        <Section titre="Button">
          <Button onPress={rien}>Reprendre la lecture</Button>
          <Button variant="secondaire" icone="download" onPress={rien}>
            Télécharger
          </Button>
          <Button variant="discret" onPress={rien}>
            Plus tard
          </Button>
          <Button variant="precieux" onPress={rien}>
            Terminer le khatm
          </Button>
          <Button variant="danger" onPress={rien}>
            Supprimer définitivement
          </Button>
          <Button pleineLargeur disabled onPress={rien}>
            Désactivé
          </Button>
        </Section>

        <Section titre="IconButton">
          <View style={styles.ligne}>
            <IconButton icone="bookmark" label="Ajouter aux favoris" onPress={rien} />
            <IconButton icone="bookmark" label="Retirer des favoris" actif onPress={rien} />
            <IconButton icone="share" label="Partager" onPress={rien} />
            <IconButton icone="arrow-left" label="Retour" taille={22} onPress={rien} />
          </View>
        </Section>

        <Section titre="TopBar">
          <TopBar retour onRetour={rien} titre="Al-Kahf" sousTitre="Sourate 18 · 110 versets" actions={[{ icone: 'bookmark', label: 'Favori', onPress: rien }, { icone: 'more', label: 'Plus', onPress: rien }]} />
          <TopBar grand titre="Lire" sousTitre="Coran, xassaïdes, invocations" actions={[{ icone: 'search', label: 'Rechercher', onPress: rien }, { icone: 'more', label: 'Plus', onPress: rien }]} />
        </Section>

        <Section titre="ListGroup et ListItem">
          <ListGroup titre="Lecture" note="Les réglages s'appliquent tout de suite.">
            <ListItem icone="globe" ton="emeraude" titre="Langue de l'interface" valeur="Français" onPress={rien} />
            <ListItem icone="moon" titre="Veille automatique" sousTitre="Écran adouci entre Isha et Fajr" droite={<Switch label="Veille automatique" active={veille} onChange={setVeille} />} />
            <ListItem titre="Wolof" fin="coche" onPress={rien} />
          </ListGroup>
          <ListGroup titre="Coran">
            <ListItem numero={18} prefixe="Sourate" titre="Al-Kahf" sousTitre="110 versets · Mecquoise" arabe="الكهف" onPress={rien} />
            <ListItem icone="trash" titre="Effacer l'historique" danger onPress={rien} />
          </ListGroup>
        </Section>

        <Section titre="Switch et SegmentedControl">
          <View style={styles.ligne}>
            <Switch label="Rappels" active={veille} onChange={setVeille} />
            <Switch label="Désactivé" active={false} onChange={rien} disabled />
          </View>
          <SegmentedControl
            label="Thème"
            options={[
              { id: 'auto', label: 'Auto' },
              { id: 'jour', label: 'Jour' },
              { id: 'nuit', label: 'Nuit' },
              { id: 'veille', label: 'Veille' },
            ]}
            valeur={segment}
            onChange={setSegment}
          />
        </Section>

        <Section titre="PageDots, RadioGroup, SearchField">
          <PageDots total={3} actif={1} />
          <RadioGroup
            label="Dans quelle langue voulez-vous l'app ?"
            options={[
              { id: 'fr', label: 'Français' },
              { id: 'wo', label: 'Wolof', description: 'Traduction en cours' },
              { id: 'ar', label: 'العربية', fin: 'RTL' },
            ]}
            valeur={langue}
            onChange={setLangue}
          />
          <SearchField placeholder="Rechercher une ville" valeur={recherche} onChange={setRecherche} />
        </Section>

        <Section titre="Banner">
          <Banner ton="attention" titre="Pas de réseau" onFermer={rien}>
            Les horaires et vos sourates téléchargées restent disponibles.
          </Banner>
          <Banner ton="veille" titre="Veille activée" action={{ label: 'Réglages', onPress: rien }}>
            Fanaanal ak jàmm. Passez la nuit en paix.
          </Banner>
          <Banner ton="info">Nouvelle traduction disponible.</Banner>
          <Banner ton="erreur" titre="Position refusée">
            Choisissez votre ville pour calculer les horaires.
          </Banner>
          <Banner ton="succes">Téléchargé : disponible sans connexion.</Banner>
        </Section>

        <Section titre="Toast et Dialog">
          <Button
            variant="secondaire"
            onPress={() => afficher({ texte: 'Ajouté aux favoris', icone: 'bookmark', action: { label: 'Annuler', onPress: rien } })}>
            Afficher un toast
          </Button>
          <Button variant="secondaire" onPress={() => setDialogue(true)}>
            Ouvrir une boîte de dialogue
          </Button>
          <Dialog
            ouvert={dialogue}
            titre="Supprimer votre compte ?"
            confirmer="Supprimer définitivement"
            danger
            icone="trash"
            onConfirmer={() => setDialogue(false)}
            onAnnuler={() => setDialogue(false)}>
            Vos favoris synchronisés seront effacés. Vos textes téléchargés restent sur ce téléphone.
          </Dialog>
        </Section>

        <Section titre="BottomSheet">
          <Button variant="secondaire" onPress={() => setFeuille(true)}>
            Choisir un récitateur
          </Button>
          <BottomSheet ouvert={feuille} titre="Choisir un récitateur" onFermer={() => setFeuille(false)}>
            <RadioGroup
              label="Récitateur"
              encadre={false}
              options={[
                { id: 'alafasy', label: 'Mishary Alafasy', description: 'Murattal' },
                { id: 'basit', label: 'Abdul Basit', description: 'Mujawwad' },
                { id: 'husary', label: 'Mahmoud Al-Husary', description: 'Murattal' },
                { id: 'minshawi', label: 'Al-Minshawi', description: 'Murattal' },
                { id: 'sudais', label: 'Abdul Rahman Al-Sudais', description: 'Murattal' },
                { id: 'shuraim', label: 'Saud Al-Shuraim', description: 'Murattal' },
              ]}
              valeur={recitateur}
              onChange={setRecitateur}
            />
          </BottomSheet>
        </Section>

        <Section titre="EmptyState">
          <EmptyState
            titre="Jàmm rekk"
            sousTitre="La paix, seulement."
            icone="bookmark"
            texte="Touchez le signet d'un verset pour le retrouver ici, même hors ligne."
            action={{ label: 'Ouvrir la bibliothèque', icone: 'book', onPress: rien }}
          />
        </Section>

        <Section titre="Icon">
          <View style={[styles.ligne, styles.grille, { gap: espace.espace4 }]}>
            {ICONES.map((n) => (
              <Icon key={n} name={n} color={couleurs.encre2} />
            ))}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  grille: { flexWrap: 'wrap' },
});
