// Contrats partagés des composants, repris de components/index.d.ts du design system.

/** Icônes au trait, grille 24, trait 1,75. Le retour est toujours `arrow-left` (« ← »), retourné en interface arabe. */
export type IconName =
  | 'play' | 'pause' | 'skip-back' | 'skip-forward' | 'repeat'
  | 'bookmark' | 'share' | 'search' | 'home' | 'book' | 'headphones' | 'clock' | 'download' | 'reset' | 'wallet' | 'bell'
  | 'arrow-left' | 'arrow-down' | 'arrow-up' | 'chevron-right' | 'chevron-down' | 'more'
  | 'check' | 'close' | 'plus' | 'minus' | 'backspace' | 'info' | 'alert' | 'offline'
  | 'moon' | 'sun' | 'globe' | 'trash' | 'edit' | 'compass' | 'pin' | 'settings' | 'user' | 'users' | 'lock'
  | 'calendar' | 'target' | 'heart' | 'balance' | 'list' | 'type' | 'bolt' | 'car' | 'cart' | 'copy' | 'kaaba';

export type Action = { label: string; onPress?: () => void };
