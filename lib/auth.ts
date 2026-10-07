import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import { useAppStore } from "./store";
import { ensureProfile } from "./profile";
import { loadActiveSpace, writeSpaceCookie } from "./space-client";
import { clearOfflineCopies } from "./pwa";
import { writeLock } from "./app-lock";

export const supabase = createClient();

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await res.json();

    if (!result.ok) {
      return { ok: false, error: result.error || "Registration failed" };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Registration failed",
    };
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error("No session created");
  }

  // Wait a bit for session to be properly set
  await new Promise((resolve) => setTimeout(resolve, 100));

  const user = await getCurrentUser();
  if (user) {
    useAppStore.getState().setUser(user);
  }
  return user;
}

/**
 * Starts Google sign-in. The browser leaves the app and comes back to
 * /auth/callback, which exchanges the code for a session.
 */
export async function signInWithGoogle(next = "/dashboard") {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

/** The ?next= of the current page if it is an internal path, for post-login redirects. */
export function nextFromLocation(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  // The PIN lock belongs to whoever was signed in on this device.
  writeLock(null);

  document.cookie = "sb-access-token=; Path=/; Max-Age=0; SameSite=Lax; Secure";
  document.cookie =
    "sb-refresh-token=; Path=/; Max-Age=0; SameSite=Lax; Secure";
  const store = useAppStore.getState();
  store.setUser(null);
  // Don't leave this person's data in memory for whoever signs in next.
  store.setTransactions([]);
  store.setAccounts([]);
  store.setCategories([]);
  store.setBudgets([]);
  useAppStore.getState().setSpace(null);
  writeSpaceCookie(null);
  await clearOfflineCopies();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Accounts from Google sign-in (or another app on the shared project)
  // get their Qala Saku profile on first visit.
  const profile = await ensureProfile(supabase, user);
  if (!profile) return null;

  const current: User = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    defaultCurrency: profile.default_currency,
    onboardingCompleted: profile.onboarding_completed,
    plan: profile.plan,
    budgetStartDay: profile.budget_start_day ?? 1,
  };

  // Set before the user so pages that wait for the user also see the space.
  try {
    const { space, owner } = await loadActiveSpace(supabase, profile.id, profile.name);
    useAppStore.getState().setSpace(space);
    // In a shared space, budget periods and currency follow the owner's settings.
    if (owner) Object.assign(current, owner);
  } catch {
    useAppStore.getState().setSpace({
      ownerId: profile.id,
      ownerName: profile.name,
      role: "owner",
      isOwn: true,
      canWrite: true,
      joined: [],
      people: {},
    });
  }
  return current;
}
