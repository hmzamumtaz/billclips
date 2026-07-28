"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    try {
      supabaseRef.current = createBrowserSupabaseClient();
    } catch {
      setLoading(false);
      return;
    }

    const supabase = supabaseRef.current;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getClient = useCallback(() => {
    if (typeof window === 'undefined') return null as unknown as SupabaseClient;
    if (!supabaseRef.current) {
      supabaseRef.current = createBrowserSupabaseClient();
    }
    return supabaseRef.current;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await getClient().auth.signInWithPassword({ email, password });
      return error?.message || null;
    } catch { return "Failed to sign in"; }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await getClient().auth.signUp({ email, password });
      return error?.message || null;
    } catch { return "Failed to sign up"; }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await getClient().auth.signOut();
    } catch {}
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await getClient().auth.getSession();
      setUser(session?.user ?? null);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
