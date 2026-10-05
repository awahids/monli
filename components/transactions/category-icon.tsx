import { icons, Circle, type LucideProps } from 'lucide-react';

/** Renders a category's lucide icon by name, falling back to a dot. */
export function CategoryIcon({ name, ...props }: { name?: string | null } & LucideProps) {
  const Icon = (name && icons[name as keyof typeof icons]) || Circle;
  return <Icon {...props} />;
}
