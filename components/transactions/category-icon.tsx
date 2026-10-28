import { AccountsIcon, Gem, Icon, ReceiptIcon, type SakuIcon, type SakuIconProps } from '@/components/brand/saku-icons';

/**
 * Icons a category or savings goal can use (the picker lists exactly these),
 * drawn for Qala Saku in the style of components/brand/saku-icons.tsx: rounded
 * strokes in the current colour, each with the gold Qala diamond. The keys are
 * the names saved on categories and goals, so they stay as they are.
 */
export const ICONS: Record<string, SakuIcon> = {
  Utensils: (p) => (
    <Icon {...p}>
      <path d="M5 3v5M8 3v5M5 8a1.5 1.5 0 0 0 3 0M6.5 9.5V21" />
      <path d="M18 21V3c-2 1.5-3 4-3 7.5h3" />
      <Gem x={11.5} y={15} r={2} />
    </Icon>
  ),
  Coffee: (p) => (
    <Icon {...p}>
      <path d="M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5V6M12.5 3.5V6" />
      <Gem x={10.5} y={14} r={2} />
    </Icon>
  ),
  Sandwich: (p) => (
    <Icon {...p}>
      <path d="M4.5 11a7.5 6 0 0 1 15 0Z" />
      <path d="M4 14.5h16" />
      <path d="M5 17.5h14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
      <Gem x={12} y={8} r={1.7} />
    </Icon>
  ),
  Pizza: (p) => (
    <Icon {...p}>
      <path d="M4 5c5-2 11-2 16 0l-8 16Z" />
      <path d="M5.4 8.4c4.4-1.6 8.8-1.6 13.2 0" />
      <Gem x={12} y={13} r={2} />
    </Icon>
  ),
  ShoppingCart: (p) => (
    <Icon {...p}>
      <path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.5 8H6" />
      <circle cx="9" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
      <Gem x={13} y={11.5} r={2} />
    </Icon>
  ),
  ShoppingBag: (p) => (
    <Icon {...p}>
      <path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
      <Gem x={12} y={15} r={2.4} />
    </Icon>
  ),
  Shirt: (p) => (
    <Icon {...p}>
      <path d="M8 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4-3c0 1.7-1.8 3-4 3S8 5.7 8 4Z" />
      <Gem x={12} y={14} r={1.8} />
    </Icon>
  ),
  Package: (p) => (
    <Icon {...p}>
      <path d="m4 8 8-4 8 4v9l-8 4-8-4Z" />
      <path d="m4 8 8 4 8-4M12 12v9" />
      <Gem x={8} y={14.5} r={1.6} />
    </Icon>
  ),
  Car: (p) => (
    <Icon {...p}>
      <path d="M5.5 17H4a1 1 0 0 1-1-1v-3l2.2-4.8A2 2 0 0 1 7 7h10a2 2 0 0 1 1.8 1.2L21 13v3a1 1 0 0 1-1 1h-1.5M9.5 17h5M3 13h18" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
      <Gem x={12} y={10} r={1.6} />
    </Icon>
  ),
  Bike: (p) => (
    <Icon {...p}>
      <circle cx="5.5" cy="16" r="3.5" />
      <circle cx="18.5" cy="16" r="3.5" />
      <path d="M5.5 16 9.5 9H15l3.5 7M9.5 9l3 7H5.5M15 9l-1-3h2.5" />
      <Gem x={12.5} y={16} r={1.6} />
    </Icon>
  ),
  Bus: (p) => (
    <Icon {...p}>
      <rect x="5" y="3" width="14" height="15" rx="3" />
      <path d="M5 10h14M9 6h6M8 18v2.5M16 18v2.5M8 14h.01M16 14h.01" />
      <Gem x={12} y={14} r={1.6} />
    </Icon>
  ),
  TrainFront: (p) => (
    <Icon {...p}>
      <path d="M7 3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
      <path d="M4 10h16M8 17l-2 4M16 17l2 4M8 13.5h.01M16 13.5h.01" />
      <Gem x={12} y={13.5} r={1.6} />
    </Icon>
  ),
  Fuel: (p) => (
    <Icon {...p}>
      <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12" />
      <path d="M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3" />
      <Gem x={9} y={8.5} r={2.2} />
    </Icon>
  ),
  CircleParking: (p) => (
    <Icon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M9.5 17V7H13a3 3 0 0 1 0 6H9.5" />
      <Gem x={16.5} y={16.5} r={1.6} />
    </Icon>
  ),
  Plane: (p) => (
    <Icon {...p}>
      <path d="M11 3.5c.8 0 1.3.8 1.3 2.2V10l6.5 3.8v1.9L12.3 14v3.8l2 1.4v1.6L11 20l-3.3.8v-1.6l2-1.4V14l-6.5 1.7v-1.9L9.7 10V5.7c0-1.4.5-2.2 1.3-2.2Z" />
      <Gem x={19} y={5} r={2.2} />
    </Icon>
  ),
  Hotel: (p) => (
    <Icon {...p}>
      <path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6" />
      <Gem x={7} y={11.5} r={2} />
    </Icon>
  ),
  House: (p) => (
    <Icon {...p}>
      <path d="m3 11 9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5" />
      <Gem x={12} y={10.5} r={1.6} />
    </Icon>
  ),
  Zap: (p) => (
    <Icon {...p}>
      <path d="M13 3 5 13h6l-1 8 8-10h-6Z" />
      <Gem x={18.5} y={18.5} r={1.8} />
    </Icon>
  ),
  Droplet: (p) => (
    <Icon {...p}>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
      <Gem x={10} y={14.5} r={1.8} />
    </Icon>
  ),
  Flame: (p) => (
    <Icon {...p}>
      <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5Z" />
      <Gem x={12} y={16.5} r={2} />
    </Icon>
  ),
  Wifi: (p) => (
    <Icon {...p}>
      <path d="M4.5 10a11 11 0 0 1 15 0M7.5 13.5a6.5 6.5 0 0 1 9 0" />
      <Gem x={12} y={17.5} r={2} />
    </Icon>
  ),
  Smartphone: (p) => (
    <Icon {...p}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 5.5h3" />
      <Gem x={12} y={17.5} r={1.6} />
    </Icon>
  ),
  Tv: (p) => (
    <Icon {...p}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M8 21h8M9 3l3 3 3-3" />
      <Gem x={12} y={12} r={2.2} />
    </Icon>
  ),
  Wrench: (p) => (
    <Icon {...p}>
      <path d="M15 3.5a5 5 0 0 0-4.6 7L4 17a2 2 0 0 0 3 3l6.5-6.4a5 5 0 0 0 7-4.6l-3 3-3-.5-.5-3Z" />
      <Gem x={18.5} y={18.5} r={1.8} />
    </Icon>
  ),
  HeartPulse: (p) => (
    <Icon {...p}>
      <path d="M12 20s-8-4.5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.5 12 20 12 20Z" />
      <path d="M4.5 12h3L9 9.5l2 5 1.5-2.5h2" />
      <Gem x={16.5} y={12} r={1.6} />
    </Icon>
  ),
  Pill: (p) => (
    <Icon {...p}>
      <rect x="2.6" y="8.5" width="18.8" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="m9.5 9.5 5 5" />
      <Gem x={8.3} y={15.7} r={1.5} />
    </Icon>
  ),
  Stethoscope: (p) => (
    <Icon {...p}>
      <path d="M5 3h2M13 3h2M6 3v5a4 4 0 0 0 8 0V3M10 12v3a5 5 0 0 0 10 0v-2" />
      <Gem x={20} y={10.5} r={2.2} />
    </Icon>
  ),
  ShieldCheck: (p) => (
    <Icon {...p}>
      <path d="m12 3 7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z" />
      <Gem x={12} y={11.5} r={3} />
    </Icon>
  ),
  GraduationCap: (p) => (
    <Icon {...p}>
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5Z" />
      <path d="M6 11v4.5c0 1.5 2.7 3 6 3s6-1.5 6-3V11M21.5 9v5" />
      <Gem x={21.5} y={16} r={1.5} />
    </Icon>
  ),
  BookOpen: (p) => (
    <Icon {...p}>
      <path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5Z" />
      <path d="M12 6.5v13" />
      <Gem x={16.5} y={10.5} r={1.7} />
    </Icon>
  ),
  Baby: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M9.5 11.5h.01M14.5 11.5h.01M10 15.5a2.5 2.5 0 0 0 4 0" />
      <Gem x={12} y={4.5} r={1.8} />
    </Icon>
  ),
  PawPrint: (p) => (
    <Icon {...p}>
      <circle cx="6.5" cy="10.5" r="1.6" />
      <circle cx="9.5" cy="6.5" r="1.6" />
      <circle cx="14.5" cy="6.5" r="1.6" />
      <circle cx="17.5" cy="10.5" r="1.6" />
      <path d="M12 12c-2.5 0-5 3.5-5 5.5s2 3 5 3 5-1 5-3-2.5-5.5-5-5.5Z" />
      <Gem x={12} y={16.8} r={1.6} />
    </Icon>
  ),
  Gamepad2: (p) => (
    <Icon {...p}>
      <path d="M7 7h10a5 5 0 0 1 5 5v2a3 3 0 0 1-5.4 1.8L15 14H9l-1.6 1.8A3 3 0 0 1 2 14v-2a5 5 0 0 1 5-5Z" />
      <path d="M7 10v3M5.5 11.5h3" />
      <Gem x={16.5} y={11.5} r={1.8} />
    </Icon>
  ),
  Film: (p) => (
    <Icon {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
      <Gem x={12} y={12} r={2.2} />
    </Icon>
  ),
  Music: (p) => (
    <Icon {...p}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <Gem x={17.5} y={16} r={2.6} />
    </Icon>
  ),
  Ticket: (p) => (
    <Icon {...p}>
      <path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z" />
      <path d="M15 6v2M15 11v2M15 16v2" />
      <Gem x={9.5} y={12} r={2.4} />
    </Icon>
  ),
  Dumbbell: (p) => (
    <Icon {...p}>
      <path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" />
      <Gem x={12} y={12} r={1.8} />
    </Icon>
  ),
  Scissors: (p) => (
    <Icon {...p}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8 7.5 20 17M8 16.5 20 7" />
      <Gem x={13.6} y={12} r={1.4} />
    </Icon>
  ),
  Sparkles: (p) => (
    <Icon {...p}>
      <path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
      <path d="M19 17v4M17 19h4" />
      <Gem x={12} y={11} r={1.6} />
    </Icon>
  ),
  Gift: (p) => (
    <Icon {...p}>
      <rect x="4" y="10" width="16" height="10" rx="1.5" />
      <rect x="3" y="7" width="18" height="3" rx="1" />
      <path d="M12 10v10M10.5 6C8 6 6.5 3.5 8.5 3s2.5 1.5 2.5 3M13.5 6C16 6 17.5 3.5 15.5 3S13 4.5 13 6" />
      <Gem x={12} y={5.5} r={1.8} />
    </Icon>
  ),
  /** A hand offering the diamond. */
  HandHeart: (p) => (
    <Icon {...p}>
      <path d="M3 14h3v6H3M6 15h4a2 2 0 0 1 2 2H9M12 17l5-2a1.6 1.6 0 0 1 1.5 2.8L13 20.5H6" />
      <Gem x={12.5} y={7.5} r={3.5} />
    </Icon>
  ),
  Users: (p) => (
    <Icon {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16.5 14a4.5 4.5 0 0 1 4.5 5" />
      <Gem x={17} y={8.5} r={2.5} />
    </Icon>
  ),
  Receipt: ReceiptIcon,
  CreditCard: AccountsIcon,
  Percent: (p) => (
    <Icon {...p}>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <Gem x={17} y={17} r={2.8} />
    </Icon>
  ),
  Landmark: (p) => (
    <Icon {...p}>
      <path d="M3 9h18l-9-5Z" />
      <path d="M6 12v6M10 12v6M14 12v6M18 12v6M4 18h16M3 21h18" />
      <Gem x={12} y={7} r={1.3} />
    </Icon>
  ),
  Wallet: (p) => (
    <Icon {...p}>
      <path d="M19 8H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h11v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1" />
      <Gem x={16.5} y={14} r={2} />
    </Icon>
  ),
  Briefcase: (p) => (
    <Icon {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12.5h18" />
      <Gem x={12} y={12.5} r={2} />
    </Icon>
  ),
  Laptop: (p) => (
    <Icon {...p}>
      <rect x="5" y="4.5" width="14" height="10" rx="1.5" />
      <path d="M2.5 18.5h19" />
      <Gem x={12} y={9.5} r={2} />
    </Icon>
  ),
  Building2: (p) => (
    <Icon {...p}>
      <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 10h3a1 1 0 0 1 1 1v10M3 21h18" />
      <path d="M8.5 8h.01M11.5 8h.01M8.5 12h.01M11.5 12h.01M9 21v-4h2v4" />
      <Gem x={17} y={15} r={1.3} />
    </Icon>
  ),
  Banknote: (p) => (
    <Icon {...p}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 9.5h.01M18 14.5h.01" />
      <Gem x={12} y={12} r={2.8} />
    </Icon>
  ),
  Coins: (p) => (
    <Icon {...p}>
      <path d="M15 9.5A5.5 5.5 0 1 0 9.5 15" />
      <circle cx="14.5" cy="14.5" r="5.5" />
      <Gem x={14.5} y={14.5} r={2.4} />
    </Icon>
  ),
  HandCoins: (p) => (
    <Icon {...p}>
      <path d="M3 14h3v6H3M6 15h4a2 2 0 0 1 2 2H9M12 17l5-2a1.6 1.6 0 0 1 1.5 2.8L13 20.5H6" />
      <circle cx="15.5" cy="7.5" r="3" />
      <Gem x={9} y={6.5} r={2.2} />
    </Icon>
  ),
  PiggyBank: (p) => (
    <Icon {...p}>
      <ellipse cx="11" cy="13" rx="7" ry="5.5" />
      <path d="M18 11h1.5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H18M8 18v2.5M14 18v2.5M7.5 9 7 5.5l3.5 2.3M4 12.5c-1.5 0-2-1-1.5-2M14.5 11h.01" />
      <Gem x={13} y={4} r={1.8} />
    </Icon>
  ),
  /** The trend line ends in the diamond. */
  TrendingUp: (p) => (
    <Icon {...p}>
      <path d="m3 17 6-6 4 4 5-5" />
      <Gem x={19.5} y={7.5} r={2.6} />
    </Icon>
  ),
  Award: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 14 7.5 21l4.5-2 4.5 2L15 14" />
      <Gem x={12} y={9} r={2.4} />
    </Icon>
  ),
};

/** Shown for a missing or unknown icon name: the diamond on its own. */
function Fallback(props: SakuIconProps) {
  return (
    <Icon {...props}>
      <Gem x={12} y={12} r={3.5} />
    </Icon>
  );
}

/** Renders a category's icon by name, falling back to the diamond. */
export function CategoryIcon({ name, ...props }: { name?: string | null } & SakuIconProps) {
  const Icon = (name && ICONS[name]) || Fallback;
  return <Icon {...props} />;
}
