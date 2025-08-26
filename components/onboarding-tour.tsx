'use client';

import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppStore } from '@/lib/store';

export function OnboardingTour() {
  const { user, setUser } = useAppStore();

  if (!user || user.onboardingCompleted) return null;

  const steps: Step[] = [
    {
      target: 'a[href="/budgets"]',
      content: 'Kelola dan rencanakan pengeluaranmu lewat fitur Budgets.',
    },
    {
      target: 'a[href="/transactions"]',
      content: 'Catat pemasukan dan pengeluaran di halaman Transactions.',
    },
    {
      target: 'a[href="/settings"]',
      content: 'Atur preferensi aplikasi pada halaman Settings.',
    },
  ];

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
