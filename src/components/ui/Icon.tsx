import {
  LineChart,
  Bitcoin,
  Gem,
  Building2,
  PiggyBank,
  Rocket,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  Crown,
  Trophy,
  Activity,
  type LucideIcon,
} from 'lucide-react';

/** Names referenced from data files → concrete lucide icons. */
const MAP: Record<string, LucideIcon> = {
  LineChart,
  Bitcoin,
  Gem,
  Building2,
  PiggyBank,
  Rocket,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  Crown,
  Trophy,
  Activity,
};

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Resolve a string icon name (from game data) to a rendered icon. */
export function Icon({ name, size = 20, color, strokeWidth = 2 }: Props) {
  const Cmp = MAP[name] ?? Sparkles;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
