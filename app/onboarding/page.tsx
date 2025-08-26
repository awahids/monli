'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    await fetch('/api/onboarding/complete', { method: 'POST' });
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Monli</h1>
      <p className="mb-8 text-center max-w-md">
        Let&apos;s set up your account before getting started with the dashboard.
      </p>
      <Button onClick={handleComplete} disabled={loading}>
        {loading ? 'Loading...' : 'Continue to Dashboard'}
      </Button>
    </div>
  );
}
