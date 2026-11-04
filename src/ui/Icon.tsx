import {
  ArrowDown, ArrowLeft, ArrowUp, Bell, BookOpen, Bookmark, Calendar, Car, Check, ChevronDown, ChevronRight, Clock,
  CloudOff, Compass, Copy, Delete, Download, Ellipsis, Eye, EyeOff, Globe, Headphones, Heart, House, Info, List, Lock, MapPin,
  Minus, Moon, Pause, Pencil, Play, Plus, Repeat, RotateCcw, Scale, Search, Share2, ShoppingCart, SkipBack,
  SkipForward, Settings, Sun, Target, Trash2, TriangleAlert, Type, User, Users, Wallet, X, Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { I18nManager } from 'react-native';

import { Kaaba } from './icones/kaaba';
import type { IconName } from './types';

const LUCIDE: Record<Exclude<IconName, 'kaaba'>, LucideIcon> = {
  play: Play, pause: Pause, 'skip-back': SkipBack, 'skip-forward': SkipForward, repeat: Repeat,
  bookmark: Bookmark, share: Share2, search: Search, home: House, book: BookOpen, headphones: Headphones,
  clock: Clock, download: Download, reset: RotateCcw, wallet: Wallet, bell: Bell,
  'arrow-left': ArrowLeft, 'arrow-down': ArrowDown, 'arrow-up': ArrowUp, 'chevron-right': ChevronRight,
  'chevron-down': ChevronDown, more: Ellipsis,
  check: Check, close: X, plus: Plus, minus: Minus, backspace: Delete, info: Info, alert: TriangleAlert, offline: CloudOff,
  moon: Moon, sun: Sun, globe: Globe, trash: Trash2, edit: Pencil, compass: Compass, pin: MapPin, settings: Settings,
  user: User, users: Users, lock: Lock,
  calendar: Calendar, target: Target, heart: Heart, balance: Scale, list: List, type: Type, bolt: Zap, car: Car,
  cart: ShoppingCart, copy: Copy, eye: Eye, 'eye-off': EyeOff,
};

// Icônes de direction : retournées en interface arabe. Jamais les icônes audio.
const SENS: ReadonlySet<IconName> = new Set(['arrow-left', 'chevron-right']);
// Icônes remplies quand elles sont actives (favori) ou par nature (lecture).
const PLEINES: ReadonlySet<IconName> = new Set(['play', 'pause']);

const TRAIT = 1.75;

type Props = {
  name: IconName;
  color: string;
  size?: number;
  /** Remplit l'icône (favori actif). */
  filled?: boolean;
};

export function Icon({ name, color, size = 20, filled = false }: Props) {
  const style = I18nManager.isRTL && SENS.has(name) ? { transform: [{ scaleX: -1 }] } : undefined;

  if (name === 'kaaba') return <Kaaba size={size} color={color} strokeWidth={TRAIT} />;

  const Lucide = LUCIDE[name];
  const plein = filled || PLEINES.has(name);
  return (
    <Lucide
      size={size}
      color={color}
      strokeWidth={TRAIT}
      fill={plein ? color : 'none'}
      style={style}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
