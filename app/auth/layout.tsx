import { Toaster } from '@/components/ui/sonner';

// The auth pages report errors with sonner toasts; the root layout only
// mounts the older shadcn toaster, so they need their own.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
