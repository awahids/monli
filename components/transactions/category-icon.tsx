import {
  Circle,
  Utensils,
  Coffee,
  Sandwich,
  Pizza,
  ShoppingCart,
  ShoppingBag,
  Shirt,
  Package,
  Car,
  Bike,
  Bus,
  TrainFront,
  Fuel,
  CircleParking,
  Plane,
  Hotel,
  House,
  Zap,
  Droplet,
  Flame,
  Wifi,
  Smartphone,
  Tv,
  Wrench,
  HeartPulse,
  Pill,
  Stethoscope,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Baby,
  PawPrint,
  Gamepad2,
  Film,
  Music,
  Ticket,
  Dumbbell,
  Scissors,
  Sparkles,
  Gift,
  HandHeart,
  Users,
  Receipt,
  CreditCard,
  Percent,
  Landmark,
  Wallet,
  Briefcase,
  Laptop,
  Building2,
  Banknote,
  Coins,
  HandCoins,
  PiggyBank,
  TrendingUp,
  Award,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

/**
 * Icons a category or savings goal can use (the picker lists exactly these).
 * Imported by name: importing lucide's full `icons` map put all ~1,500 icons
 * in every page that shows a category.
 */
export const ICONS: Record<string, LucideIcon> = {
  Utensils, Coffee, Sandwich, Pizza, ShoppingCart, ShoppingBag, Shirt, Package, Car, Bike, Bus, TrainFront, Fuel, CircleParking, Plane, Hotel, House, Zap, Droplet, Flame, Wifi, Smartphone, Tv, Wrench, HeartPulse, Pill, Stethoscope, ShieldCheck, GraduationCap, BookOpen, Baby, PawPrint, Gamepad2, Film, Music, Ticket, Dumbbell, Scissors, Sparkles, Gift, HandHeart, Users, Receipt, CreditCard, Percent, Landmark, Wallet, Briefcase, Laptop, Building2, Banknote, Coins, HandCoins, PiggyBank, TrendingUp, Award,
};

/** Renders a category's icon by name, falling back to a dot. */
export function CategoryIcon({ name, ...props }: { name?: string | null } & LucideProps) {
  const Icon = (name && ICONS[name]) || Circle;
  return <Icon {...props} />;
}
