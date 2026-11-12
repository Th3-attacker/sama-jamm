import type * as React from 'react';

/** Icônes au trait, grille 24, trait 1,75. Le retour est toujours `arrow-left` (« ← »), retourné en interface arabe. */
export type IconName =
  | 'play' | 'pause' | 'skip-back' | 'skip-forward' | 'repeat'
  | 'bookmark' | 'share' | 'search' | 'home' | 'book' | 'headphones' | 'clock' | 'download' | 'reset' | 'wallet' | 'bell'
  | 'arrow-left' | 'arrow-down' | 'arrow-up' | 'chevron-right' | 'chevron-down' | 'more'
  | 'check' | 'close' | 'plus' | 'minus' | 'backspace' | 'info' | 'alert' | 'offline'
  | 'moon' | 'sun' | 'globe' | 'trash' | 'edit' | 'compass' | 'pin' | 'settings' | 'user' | 'users' | 'lock'
  | 'calendar' | 'target' | 'heart' | 'balance' | 'list' | 'type' | 'bolt' | 'car' | 'cart' | 'copy' | 'kaaba';

/** Une devise du foyer. Les montants sont stockés en entiers dans la plus petite unité (voir la section Budget). */
export interface Devise {
  /** Code ISO 4217 quand il existe : 'XOF', 'MRU'. */
  code?: string;
  nom?: string;
  /** Affiché à côté du montant : 'F CFA', 'UM', 'DH'. */
  symbole: string;
  /** 'apres' (défaut, usage français) ou 'avant'. */
  position?: 'avant' | 'apres';
  /** Chiffres après la virgule à l'affichage : 0 à 2. */
  decimales?: 0 | 1 | 2;
  /** Nombre de plus petites unités dans une unité : 1 (F CFA), 5 (ouguiya, khoums), 100 (centimes). */
  sousUnites?: number;
}

// ——— Actions ———

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** principal : émeraude, une fois par écran · secondaire : contour · discret : texte seul · precieux : aplat or, rare · danger : geste destructeur, toujours confirmé. */
  variant?: 'principal' | 'secondaire' | 'discret' | 'precieux' | 'danger';
  /** Icône à gauche du libellé. */
  icone?: IconName;
  /** Occupe toute la largeur du conteneur (bas d'écran). */
  pleineLargeur?: boolean;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icone: IconName;
  /** Obligatoire : lu par les lecteurs d'écran. */
  label: string;
  /** Icône pleine et émeraude (favori actif). */
  actif?: boolean;
  /** Taille de l'icône en px, 20 par défaut ; la zone tactile reste 44. */
  taille?: number;
}
export declare function IconButton(props: IconButtonProps): React.ReactElement;

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selectionne?: boolean;
  /** Nombre d'éléments correspondants, affiché après le libellé. */
  compte?: number;
  children?: React.ReactNode;
}
export declare function Chip(props: ChipProps): React.ReactElement;

export interface BadgeProps {
  /** neutre (défaut) · emeraude : disponible, téléchargé · or : nouveau · alerte : bientôt atteint · erreur : dépassé. */
  ton?: 'neutre' | 'emeraude' | 'or' | 'alerte' | 'erreur';
  icone?: IconName;
  /** Un ou deux mots, jamais une couleur seule. */
  children: React.ReactNode;
}
export declare function Badge(props: BadgeProps): React.ReactElement;

// ——— Navigation ———

export interface TopBarAction { icone: IconName; label: string; onClick?: () => void; actif?: boolean }
export interface TopBarProps {
  /** true ou un libellé (« Retour aux horaires ») : affiche la flèche « ← ». */
  retour?: boolean | string;
  onRetour?: () => void;
  titre?: string;
  sousTitre?: string;
  /** Deux actions au plus, la dernière est souvent le menu Plus. */
  actions?: TopBarAction[];
  /** Grand titre Cormorant sous la barre : écrans racines des onglets. */
  grand?: boolean;
  /** Langue du grand titre (« wo » pour un titre wolof). */
  lang?: string;
  /** Sans fond, au-dessus d'une image ou du lecteur plein écran. */
  transparent?: boolean;
}
export declare function TopBar(props: TopBarProps): React.ReactElement;

export interface Onglet { id: string; label: string; icone: IconName }
export interface TabBarProps {
  /** Cinq onglets au plus. Par défaut : Accueil, Lire, Écouter, Prière, Budget. */
  onglets?: Onglet[];
  actif?: string;
  onChange?: (id: string) => void;
}
export declare function TabBar(props: TabBarProps): React.ReactElement;

export interface MenuItem { icone?: IconName; label: string; onClick?: () => void; fin?: string; danger?: boolean; separateur?: false }
export interface MenuSeparator { separateur: true }
export interface MenuProps {
  label?: string;
  items: Array<MenuItem | MenuSeparator>;
}
export declare function Menu(props: MenuProps): React.ReactElement;

export interface PageDotsProps { total?: number; /** Index commençant à 0. */ actif?: number }
export declare function PageDots(props: PageDotsProps): React.ReactElement;

export interface SectionHeaderProps {
  titre: string;
  /** « wo » quand le titre est en wolof. */
  lang?: string;
  /** Traduction ou précision, en italique. */
  sousTitre?: string;
  action?: { label: string; onClick?: () => void };
}
export declare function SectionHeader(props: SectionHeaderProps): React.ReactElement;

// ——— Listes et saisie ———

export interface ListItemProps {
  titre: string;
  sousTitre?: string;
  /** Icône dans une pastille ; ou bien `numero` pour un médaillon étoilé. */
  icone?: IconName;
  /** Couleur de la pastille d'icône. */
  ton?: 'emeraude' | 'or' | 'neutre';
  numero?: number;
  /** Lu avant le numéro par les lecteurs d'écran : « Sourate », « Juz ». */
  prefixe?: string;
  /** Nom arabe affiché à droite (sens RTL). */
  arabe?: string;
  /** Valeur courante d'un réglage : « Wolof », « 28 ». */
  valeur?: React.ReactNode;
  /** Élément à droite : Switch, Badge, bouton de téléchargement. Les enfants (children) servent aussi d'élément à droite. */
  droite?: React.ReactNode;
  children?: React.ReactNode;
  /** chevron : ouvre un écran · coche : choix courant d'une liste. Par défaut chevron si onClick. */
  fin?: 'chevron' | 'coche';
  danger?: boolean;
  onClick?: () => void;
}
export declare function ListItem(props: ListItemProps): React.ReactElement;

export interface ListGroupProps { titre?: string; note?: string; children: React.ReactNode }
export declare function ListGroup(props: ListGroupProps): React.ReactElement;

export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Libellé lu par les lecteurs d'écran (caché à l'œil). */
  label?: string;
  id?: string;
}
export declare function SearchField(props: SearchFieldProps): React.ReactElement;

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Toujours visible au-dessus du champ, jamais remplacé par le texte indicatif. */
  label: string;
  aide?: string;
  /** Remplace l'aide, bordure et texte erreur, icône d'alerte. */
  erreur?: string;
  prefixe?: React.ReactNode;
  /** Unité ou devise : « F CFA ». */
  suffixe?: React.ReactNode;
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

export interface SwitchProps {
  active?: boolean;
  onChange?: (active: boolean) => void;
  /** Obligatoire hors d'une ligne de liste qui le nomme. */
  label: string;
  disabled?: boolean;
}
export declare function Switch(props: SwitchProps): React.ReactElement;

export interface CheckboxProps {
  coche?: boolean;
  onChange?: (coche: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}
export declare function Checkbox(props: CheckboxProps): React.ReactElement;

export interface RadioOption { id: string; label: string; description?: string; /** Texte court à droite : symbole, taille. */ fin?: string }
export interface RadioGroupProps {
  label?: string;
  /** Nom du groupe (attribut name). */
  nom?: string;
  options: RadioOption[];
  valeur?: string;
  onChange?: (id: string) => void;
}
export declare function RadioGroup(props: RadioGroupProps): React.ReactElement;

export interface SegmentedControlProps {
  label: string;
  /** Deux à quatre options, libellés d'un ou deux mots. */
  options: Array<{ id: string; label: string }>;
  valeur?: string;
  onChange?: (id: string) => void;
}
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;

export interface SliderProps {
  label: string;
  min?: number;
  max?: number;
  pas?: number;
  valeur?: number;
  onChange?: (valeur: number) => void;
  /** Texte de la valeur affichée et lue : (v) => v + ' pt'. */
  format?: (valeur: number) => string;
  /** Repères visuels aux extrémités (petit A, grand A). */
  gauche?: React.ReactNode;
  droite?: React.ReactNode;
}
export declare function Slider(props: SliderProps): React.ReactElement;

// ——— Retours ———

export interface ProgressBarProps {
  /** De 0 à 1 ; au-delà de 1, la barre est pleine et passe en erreur. */
  valeur: number;
  label?: string;
  /** La valeur écrite : « Verset 46 sur 110 ». Toujours fournie. */
  detail?: string;
  /** emeraude (défaut) · or : progression spirituelle (lecture, khatm, épargne) · alerte · erreur. */
  ton?: 'emeraude' | 'or' | 'alerte' | 'erreur';
  /** Barre de 4 px sans en-tête, dans une ligne qui porte déjà le texte. */
  fine?: boolean;
  nomAccessible?: string;
}
export declare function ProgressBar(props: ProgressBarProps): React.ReactElement;

export interface BannerProps {
  /** info · attention (hors ligne) · erreur · veille · succes. */
  ton?: 'info' | 'attention' | 'erreur' | 'veille' | 'succes';
  titre?: string;
  icone?: IconName;
  action?: { label: string; onClick?: () => void };
  onFermer?: () => void;
  children?: React.ReactNode;
}
export declare function Banner(props: BannerProps): React.ReactElement;

export interface ToastProps {
  icone?: IconName;
  /** Une action au plus, souvent « Annuler ». */
  action?: { label: string; onClick?: () => void };
  children: React.ReactNode;
}
export declare function Toast(props: ToastProps): React.ReactElement;

export interface DialogProps {
  ouvert?: boolean;
  titre: string;
  icone?: IconName;
  /** Bouton de confirmation en variante danger. */
  danger?: boolean;
  /** Libellé du verbe exact : « Supprimer définitivement ». */
  confirmer?: string;
  annuler?: string;
  onConfirmer?: () => void;
  onAnnuler?: () => void;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): React.ReactElement | null;

export interface BottomSheetProps {
  ouvert?: boolean;
  titre: string;
  onFermer?: () => void;
  children?: React.ReactNode;
}
export declare function BottomSheet(props: BottomSheetProps): React.ReactElement | null;

export interface EmptyStateProps {
  /** Titre wolof court : « Jàmm rekk ». */
  titre: string;
  lang?: string;
  /** Sa traduction, en italique. */
  sousTitre?: string;
  /** Ce qu'il faut faire pour remplir l'écran. */
  texte?: string;
  icone?: IconName;
  action?: { label: string; icone?: IconName; onClick?: () => void };
}
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

export interface SkeletonProps {
  forme?: 'liste' | 'carte';
  lignes?: number;
  label?: string;
}
export declare function Skeleton(props: SkeletonProps): React.ReactElement;

// ——— Lecture ———

export interface ReadingCardProps {
  /** Numéro du verset ou de la strophe, dans le médaillon étoilé. */
  numero?: number;
  /** Texte arabe complet, jamais tronqué. */
  arabe: string;
  /** true (défaut) : police coranique ; false : arabe courant (xassaïdes, invocations). */
  coran?: boolean;
  translitteration?: string;
  traduction?: string;
  /** Référence courte : « Al-Fâtiha · 1 ». */
  source?: string;
  favori?: boolean;
}
export declare function ReadingCard(props: ReadingCardProps): React.ReactElement;

export interface OrnamentProps {
  /** separateur (défaut) : étoile entre deux filets or · medaillon : étoile numérotée. */
  variante?: 'separateur' | 'medaillon';
  numero?: number;
  taille?: number;
}
export declare function Ornament(props: OrnamentProps): React.ReactElement;

export interface MedallionProps { numero: number; size?: number; /** « Verset » par défaut. */ prefixe?: string }
export declare function Medallion(props: MedallionProps): React.ReactElement;

export interface VerseShareCardProps {
  arabe: string;
  traduction?: string;
  /** « Ar-Ra‘d · 13:28 ». */
  source: string;
  /** emeraude (défaut) ou nuit. Couleurs de marque fixes, quel que soit le thème. */
  fond?: 'emeraude' | 'nuit';
  /** Côté en px à l'écran ; l'export se fait à 1080 × 1080. */
  taille?: number;
}
export declare function VerseShareCard(props: VerseShareCardProps): React.ReactElement;

// ——— Audio ———

export interface AudioPlayerProps {
  titre: string;
  sousTitre?: string;
  /** De 0 à 1. */
  progression?: number;
  enLecture?: boolean;
}
export declare function AudioPlayer(props: AudioPlayerProps): React.ReactElement;

// ——— Prière ———

export interface Priere {
  /** Nom usuel : « Fajr ». */
  nom: string;
  /** Nom dans la langue de l'utilisateur : « Fajar ». */
  nomLocal?: string;
  nomArabe?: string;
  /** Heure locale « 06:12 », calculée sur le téléphone. */
  heure: string;
  etat: 'passee' | 'prochaine' | 'a-venir';
}
export interface PrayerTimesProps {
  lieu: string;
  date: string;
  prieres: Priere[];
  /** Compte à rebours de la prochaine prière : « dans 42 min ». */
  dans?: string;
}
export declare function PrayerTimes(props: PrayerTimesProps): React.ReactElement;

export interface DayArcProps {
  /** Heures locales « HH:MM ». */
  lever: string;
  coucher: string;
  maintenant: string;
  prieres: Priere[];
  /** Compte à rebours en grand : « 42 min ». */
  dans?: string;
  /** Phrase lue par les lecteurs d'écran. */
  description?: string;
}
export declare function DayArc(props: DayArcProps): React.ReactElement;

export interface QiblaCompassProps {
  /** Cap du téléphone en degrés depuis le nord (expo-location, heading). */
  cap: number;
  /** Relèvement de la qibla en degrés depuis le nord, calculé depuis la position. */
  qibla: number;
  /** Écart toléré pour « Vous faites face à la qibla », 3° par défaut. */
  tolerance?: number;
  lieu?: string;
}
export declare function QiblaCompass(props: QiblaCompassProps): React.ReactElement;

export interface TasbihCounterProps {
  compte?: number;
  objectif?: number;
  formule?: string;
  formuleArabe?: string;
}
export declare function TasbihCounter(props: TasbihCounterProps): React.ReactElement;

// ——— Ensemble ———

export interface BeadThreadProps {
  titre?: string;
  /** Un grain par jour du mois en cours. */
  jours: Array<{ fait: boolean; aujourdhui?: boolean }>;
  /** Total positif : « 12 jours de lecture en octobre », jamais une série perdue. */
  resume?: string;
}
export declare function BeadThread(props: BeadThreadProps): React.ReactElement;

export interface Juz { n: number; etat: 'lu' | 'en-cours' | 'vous' | 'libre'; /** Prénom de qui le lit. */ qui?: string }
export interface KhatmGridProps {
  /** Les 30 juz. */
  juz: Juz[];
  /** Rend les juz libres touchables pour les prendre. */
  onChoisir?: (n: number) => void;
  legende?: boolean;
  label?: string;
}
export declare function KhatmGrid(props: KhatmGridProps): React.ReactElement;

// ——— Budget ———

export interface AmountDisplayProps {
  /** En unités principales (350000 pour 350 000 F CFA). */
  montant: number;
  devise?: Devise;
  libelle?: string;
  detail?: string;
  /** '+' pour un revenu, '-' pour une dépense saisie. */
  signe?: '+' | '-';
  /** neutre (défaut) · revenu : émeraude · alerte. Une dépense n'est jamais en rouge. */
  ton?: 'neutre' | 'revenu' | 'alerte';
  centre?: boolean;
  /** Affiche le curseur de saisie (avec Keypad). */
  saisie?: boolean;
}
export declare function AmountDisplay(props: AmountDisplayProps): React.ReactElement;

export interface KeypadProps {
  /** '0'…'9', '000' ou 'efface'. */
  onTouche?: (touche: string) => void;
}
export declare function Keypad(props: KeypadProps): React.ReactElement;

export interface EnvelopeProps {
  nom: string;
  icone?: IconName;
  /** Dépensé dans le cycle, en unités principales. */
  depense: number;
  plafond: number;
  devise?: Devise;
  /** Charge fixe (loyer) : pleine = « Réglé », pas « attention ». */
  fixe?: boolean;
  onClick?: () => void;
}
export declare function Envelope(props: EnvelopeProps): React.ReactElement;

export interface SavingsGoalProps {
  nom: string;
  /** La niyya, écrite par l'utilisateur. */
  intention?: string;
  epargne: number;
  /** Sans objectif chiffré : pas de barre. */
  objectif?: number;
  echeance?: string;
  devise?: Devise;
  icone?: IconName;
  conseil?: string;
}
export declare function SavingsGoal(props: SavingsGoalProps): React.ReactElement;

// ——— Dons ———

export interface WalletCardProps {
  /** Nom du wallet : « Bankily », « Masrvi », « Wave ». */
  nom: string;
  /** Pays et devise : « Mauritanie · MRU ». */
  pays?: string;
  /** Numéro où envoyer le don, affiché groupé par deux chiffres. */
  numero: string;
  /** Titulaire du compte, tel que le wallet l'affiche avant l'envoi. */
  titulaire?: string;
  /** true : carte ouverte et cochée · false : repliée (en-tête seul) · absent : ouverte sans coche. */
  choisi?: boolean;
  onChoisir?: () => void;
  onCopie?: () => void;
}
export declare function WalletCard(props: WalletCardProps): React.ReactElement;

/** « 350 000 F CFA » : espace fine insécable entre milliers, virgule décimale, symbole selon la devise. */
export declare function formatMontant(montant: number, devise?: Devise): string;
export declare const DEVISES: { XOF: Devise; MRU: Devise };

declare global {
  interface Window {
    SamaJamm: {
      Button: typeof Button; IconButton: typeof IconButton; Chip: typeof Chip; Badge: typeof Badge;
      TopBar: typeof TopBar; TabBar: typeof TabBar; Menu: typeof Menu; PageDots: typeof PageDots; SectionHeader: typeof SectionHeader;
      ListItem: typeof ListItem; ListGroup: typeof ListGroup; SearchField: typeof SearchField; TextField: typeof TextField;
      Switch: typeof Switch; Checkbox: typeof Checkbox; RadioGroup: typeof RadioGroup; SegmentedControl: typeof SegmentedControl; Slider: typeof Slider;
      ProgressBar: typeof ProgressBar; Banner: typeof Banner; Toast: typeof Toast; Dialog: typeof Dialog; BottomSheet: typeof BottomSheet;
      EmptyState: typeof EmptyState; Skeleton: typeof Skeleton;
      ReadingCard: typeof ReadingCard; Ornament: typeof Ornament; Medallion: typeof Medallion; VerseShareCard: typeof VerseShareCard;
      AudioPlayer: typeof AudioPlayer;
      DayArc: typeof DayArc; PrayerTimes: typeof PrayerTimes; QiblaCompass: typeof QiblaCompass; TasbihCounter: typeof TasbihCounter;
      BeadThread: typeof BeadThread; KhatmGrid: typeof KhatmGrid;
      AmountDisplay: typeof AmountDisplay; Keypad: typeof Keypad; Envelope: typeof Envelope; SavingsGoal: typeof SavingsGoal;
      WalletCard: typeof WalletCard;
      Icon: (props: { name: IconName; size?: number; filled?: boolean; className?: string }) => React.ReactElement;
      formatMontant: typeof formatMontant; DEVISES: typeof DEVISES; ICONES: IconName[];
    };
  }
}
