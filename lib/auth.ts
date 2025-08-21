
import { createBrowserClient } from '@/lib/supabase/client';
import { User } from '@/types';
import { useAppStore } from './store';

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createBrowserClient();
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error('No session created');
  }

  // Wait a bit for session to be properly set
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const user = await getCurrentUser();
  if (user) {
    useAppStore.getState().setUser(user);
  }
  return user;
}

export async function signOut() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();

  document.cookie = 'sb-access-token=; Path=/; Max-Age=0; SameSite=Lax; Secure';
  document.cookie = 'sb-refresh-token=; Path=/; Max-Age=0; SameSite=Lax; Secure';
  useAppStore.getState().setUser(null);
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    defaultCurrency: profile.default_currency,
  };
}
