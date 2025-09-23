import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/config/flags';
import { sessionBackupManager } from '@/auth/sessionBackup';
import { clearAuthStorageSafe } from '@/auth/clearAuthStorage';

type AuthSessionContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  status: 'checking' | 'guest' | 'authed';
};

const AuthSessionContext = createContext<AuthSessionContextType | null>(null);

export const useAuthSession = () => {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return context;
};

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<() => void>();
  const endedRef = useRef(false);

  const status: 'checking' | 'guest' | 'authed' = 
    loading ? 'checking' : user ? 'authed' : 'guest';

  useEffect(() => {
    let cancelled = false;
    
    // Set up auth state subscription
    unsubRef.current?.();
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;
      
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[AuthSession] Auth state changed:', {
          event,
          userId: newSession?.user?.id,
          hasUser: !!newSession?.user,
          timestamp: new Date().toISOString(),
        });
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Session backup on auth events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (newSession) {
          sessionBackupManager.backupSession(newSession);
        }
      }

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        clearAuthStorageSafe();
        sessionBackupManager.clearBackup();
      }

      // End loading on key auth events
      if (!endedRef.current && (
        event === 'INITIAL_SESSION' || 
        event === 'SIGNED_IN' || 
        event === 'TOKEN_REFRESHED' || 
        event === 'SIGNED_OUT'
      )) {
        endedRef.current = true;
        setLoading(false);
      }
    });
    
    unsubRef.current = () => data.subscription.unsubscribe();

    // Initialize session
    (async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        console.warn('[AuthSession] Session initialization failed:', error);
      } finally {
        if (!cancelled && !endedRef.current) {
          endedRef.current = true;
          setLoading(false);
        }
      }
    })();

    // Watchdog timer
    const watchdog = setTimeout(() => {
      if (!cancelled && !endedRef.current) {
        console.warn('[AuthSession] Watchdog: forcing loading=false');
        endedRef.current = true;
        setLoading(false);
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = undefined;
      }
    };
  }, []);

  return (
    <AuthSessionContext.Provider value={{ user, session, loading, status }}>
      {children}
    </AuthSessionContext.Provider>
  );
}