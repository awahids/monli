'use client';

import { useEffect, useState } from 'react';
import { CartoonAvatar } from '@/components/brand/cartoon-avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

/** Signed links to AI cartoons, valid an hour; kept so every avatar on a page shares one. */
const links = new Map<string, Promise<string | null>>();

function signedLink(path: string): Promise<string | null> {
  let link = links.get(path);
  if (!link) {
    link = import('@/lib/supabase')
      .then(({ supabase }) => supabase.storage.from('avatars').createSignedUrl(path, 3600))
      .then(({ data }) => data?.signedUrl ?? null)
      .catch(() => null);
    links.set(path, link);
    setTimeout(() => links.delete(path), 50 * 60 * 1000);
  }
  return link;
}

/**
 * The person's profile picture: their AI cartoon when they made one (PRO),
 * otherwise the drawn cartoon from their seed or account id.
 */
export function UserAvatar({
  user,
  className,
}: {
  user: Pick<User, 'id' | 'avatarSeed' | 'avatarPath'> | null | undefined;
  className?: string;
}) {
  const path = user?.avatarPath ?? null;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    if (!path) return;
    let live = true;
    signedLink(path).then((url) => live && setSrc(url));
    return () => {
      live = false;
    };
  }, [path]);

  const classes = cn('block shrink-0 overflow-hidden rounded-full', className);
  if (path && src) {
    // eslint-disable-next-line @next/next/no-img-element -- a signed storage link, not a static asset
    return <img src={src} alt="" className={cn(classes, 'bg-white object-cover')} />;
  }
  return <CartoonAvatar seed={user?.avatarSeed || user?.id || 'qala'} className={classes} />;
}
