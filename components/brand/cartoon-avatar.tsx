import { cn } from '@/lib/utils';

/**
 * The profile picture every account has: an Open Peeps illustration (by Pablo
 * Stanley, CC0) in colours and details picked from `seed`, drawn by
 * app/api/avatar/[seed].
 */
export function CartoonAvatar({ seed, className }: { seed: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- an SVG drawn per seed, nothing for next/image to optimise
    <img src={`/api/avatar/${encodeURIComponent(seed)}`} alt="" className={cn('h-10 w-10', className)} />
  );
}
