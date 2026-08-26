import {
  Flame,
  Droplet,
  BookOpen,
  Activity,
  Target,
  Brain,
  Briefcase,
  Palette,
  Plane,
  Languages,
  Banknote,
  Trophy,
  Star,
  Medal,
  Crown,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  droplet: Droplet,
  "book-open": BookOpen,
  activity: Activity,
  target: Target,
  lotus: Brain,
  brain: Brain,
  briefcase: Briefcase,
  palette: Palette,
  plane: Plane,
  languages: Languages,
  banknote: Banknote,
  trophy: Trophy,
  star: Star,
  medal: Medal,
  crown: Crown,
};

const COLORS: Record<string, string> = {
  "#A78BFA": "bg-violet-100 text-violet-600",
  "#38BDF8": "bg-sky-100 text-sky-600",
  "#FBBF24": "bg-amber-100 text-amber-600",
  "#34D399": "bg-emerald-100 text-emerald-600",
  "#F87171": "bg-red-100 text-red-500",
  "#F97316": "bg-orange-100 text-orange-500",
};

export default function HabitIcon({
  icon,
  colorTheme,
  size = 40,
}: {
  icon: string;
  colorTheme?: string | null;
  size?: number;
}) {
  const Icon = ICONS[icon] ?? Sparkles;
  const tone =
    (colorTheme && COLORS[colorTheme]) ?? "bg-emerald-100 text-emerald-700";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${tone}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </div>
  );
}
