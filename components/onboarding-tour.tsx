'use client';

import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppStore } from '@/lib/store';

const TOUR = [
  {
    href: '/budgets',
    content: 'Kelola dan rencanakan pengeluaranmu lewat fitur Budgets.',
  },
  {
    href: '/transactions',
    content: 'Catat pemasukan dan pengeluaran di halaman Transactions.',
  },
  {
    href: '/settings',
    content: 'Atur preferensi aplikasi pada halaman Settings.',
  },
];

// The same link exists in the desktop sidebar and the mobile bottom nav;
// only one of them is visible at a time.
function findVisibleLink(href: string): HTMLElement | null {
  const links = Array.from(
    document.querySelectorAll<HTMLElement>(`a[href="${href}"]`),
  );
  return links.find((el) => el.getClientRects().length > 0) ?? null;
}

export function OnboardingTour() {
  const { user, setUser } = useAppStore();
  const [steps, setSteps] = useState<Step[]>([]);
  const shouldRun = Boolean(user && !user.onboardingCompleted);

  useEffect(() => {
    if (!shouldRun) return;
    const resolved = TOUR.flatMap(({ href, content }) => {
      const target = findVisibleLink(href);
      return target ? [{ target, content }] : [];
    });
    setSteps(resolved);
  }, [shouldRun]);

  if (!user || !shouldRun || steps.length === 0) return null;

  const handleCallback = async (data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      try {
        await fetch('/api/onboarding/complete', { method: 'POST' });
        setUser({ ...user, onboardingCompleted: true });
      } catch (e) {
        console.error('Failed to mark onboarding complete', e);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run
      continuous
      showSkipButton
      callback={handleCallback}
      styles={{ options: { zIndex: 10000 } }}
    />
  );
}
