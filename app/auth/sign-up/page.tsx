'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerUser } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { QalaMark } from "@/components/brand/qala-mark";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { QalaFamilyLink } from "@/components/brand/qala-family";
import { LanguageLink } from '@/components/layout/language-link';
import { useMessage, useT } from '@/lib/i18n';

const signUpSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi kata sandi tidak sama",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useT();
  const message = useMessage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || t('Pendaftaran gagal', 'Sign-up failed'));
      }
      
      toast({
        title: t('Pendaftaran berhasil!', 'Signed up!'),
        description: t('Cek email kamu untuk verifikasi akun, lalu masuk.', 'Check your email to verify your account, then sign in.'),
      });

      // Redirect to sign-in page after successful registration
      router.replace('/auth/sign-in');
    } catch (e) {
      console.error('Sign up error:', e);
      toast({
        title: t('Pendaftaran gagal', 'Sign-up failed'),
        description: e instanceof Error ? e.message : t('Terjadi kesalahan', 'Something went wrong'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onError = (errs: typeof errors) => {
    const first = Object.keys(errs)[0] as keyof SignUpForm | undefined;
    if (first) setFocus(first);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-16" />
      <Card className="w-full max-w-md relative shadow-xl border-0 bg-card/95 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-lg" />
        <CardHeader className="text-center relative z-10 pb-8">
          <Link href="/" aria-label={t('Qala Saku, beranda', 'Qala Saku, home')} className="mx-auto mb-4 inline-flex rounded-md">
            <QalaMark className="h-10" />
          </Link>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {t('Buat akun', 'Create account')}
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            {t('Mulai atur keuanganmu dengan Qala Saku', 'Start managing your money with Qala Saku')}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 pt-0">
          <GoogleSignIn label={t('Daftar dengan Google', 'Sign up with Google')} />
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground/90">{t('Nama lengkap', 'Full name')}</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder={t('Nama lengkap', 'Full name')}
                disabled={loading}
                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message(errors.name.message ?? '')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email</Label>
              <Input
                id="email"
                {...register('email')}
                type="email"
                placeholder={t('Masukkan email', 'Enter your email')}
                disabled={loading}
                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message(errors.email.message ?? '')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/90">{t('Kata sandi', 'Password')}</Label>
              <Input
                id="password"
                {...register('password')}
                type="password"
                placeholder={t('Buat kata sandi', 'Create a password')}
                disabled={loading}
                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message(errors.password.message ?? '')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/90">{t('Ulangi kata sandi', 'Repeat password')}</Label>
              <Input
                id="confirmPassword"
                {...register('confirmPassword')}
                type="password"
                placeholder={t('Ulangi kata sandi', 'Repeat password')}
                disabled={loading}
                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
              />
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message(errors.confirmPassword.message ?? '')}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:scale-100" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('Membuat akun...', 'Creating account...')}
                </>
              ) : (
                <>
                  <span>{t('Buat akun', 'Create account')}</span>
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                {t('Sudah punya akun?', 'Already have an account?')}{' '}
                <Link
                  href="/auth/sign-in"
                  className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                >
                  {t('Masuk', 'Sign in')}
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      <QalaFamilyLink className="relative text-xs text-muted-foreground" />
      <LanguageLink className="relative" />
    </div>
  );
}