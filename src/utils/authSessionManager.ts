// Enhanced auth session manager with singleton pattern, pre-refresh, and cross-tab sync
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export interface AuthEvents {
  'session-changed': { session: Session | null; user: User | null; event: string };
  'session-expired': { reason: string };
  'profile-updated': { userId: string; profile: any };
  'force-signout': { reason: string };
}

class AuthSessionManager {
  private static instance: AuthSessionManager;
  private isInitialized = false;
  private subscriptionActive = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private currentSession: Session | null = null;
  private eventHandlers = new Map<keyof AuthEvents, Set<Function>>();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('pb-auth');
      this.setupBroadcastHandlers();
    }
  }

  static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager();
    }
    return AuthSessionManager.instance;
  }

  private setupBroadcastHandlers() {
    if (!this.broadcastChannel) return;

    this.broadcastChannel.addEventListener('message', (event) => {
      const { type, data } = event.data;
      console.log('📡 AuthSession: Received broadcast:', type, data);

      switch (type) {
        case 'SIGNED_OUT':
          this.emit('force-signout', { reason: 'Cross-tab signout' });
          break;
        case 'SIGNED_IN':
          // Refresh current tab session when user signs in from another tab
          setTimeout(() => {
            void supabase.auth.getSession();
          }, 100);
          break;
        case 'PROFILE_UPDATED':
          this.emit('profile-updated', data);
          break;
      }
    });
  }

  private broadcastMessage(type: string, data?: any) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, data });
      console.log('📡 AuthSession: Broadcasting:', type, data);
    }
  }

  private setupSessionRefreshTimer(session: Session) {
    this.clearRefreshTimer();
    
    if (!session.expires_at) return;

    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // Schedule refresh 90 seconds before expiry
    const refreshTime = Math.max(timeUntilExpiry - 90000, 5000); // At least 5s from now
    
    if (refreshTime > 0) {
      console.log(`🕐 AuthSession: Scheduling refresh in ${Math.round(refreshTime / 1000)}s`);
      
      this.refreshTimer = setTimeout(async () => {
        console.log('🔄 AuthSession: Pre-emptive token refresh');
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('❌ AuthSession: Pre-refresh failed:', error);
            this.emit('session-expired', { reason: 'Pre-refresh failed' });
          } else if (data.session) {
            console.log('✅ AuthSession: Pre-refresh successful');
            this.setupSessionRefreshTimer(data.session);
          }
        } catch (error) {
          console.error('❌ AuthSession: Pre-refresh error:', error);
          this.emit('session-expired', { reason: 'Pre-refresh error' });
        }
      }, refreshTime);
    }
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private setupVisibilityHandlers() {
    if (this.visibilityHandler) return; // Already set up

    this.visibilityHandler = async () => {
      if (document.visibilityState === 'visible' && navigator.onLine && this.currentSession) {
        console.log('👀 AuthSession: Tab became visible, checking session validity');
        
        try {
          // First check current session validity
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.log('⚠️ AuthSession: No valid session on visibility change');
            return;
          }

          // Then verify with server
          const { error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.warn('⚠️ AuthSession: Token invalid on visibility change, need refresh');
            await supabase.auth.refreshSession();
          } else {
            console.log('✅ AuthSession: Session valid after visibility change');
          }
        } catch (error) {
          console.error('❌ AuthSession: Error checking session on visibility:', error);
        }
      }
    };

    this.onlineHandler = async () => {
      if (navigator.onLine && this.currentSession) {
        console.log('🌐 AuthSession: Back online, validating session');
        
        try {
          const { error } = await supabase.auth.getUser();
          if (error) {
            console.warn('⚠️ AuthSession: Session invalid after coming online');
            await supabase.auth.refreshSession();
          }
        } catch (error) {
          console.error('❌ AuthSession: Error validating session after coming online:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('online', this.onlineHandler);
  }

  private removeVisibilityHandlers() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
  }

  initialize(onAuthStateChange: (event: string, session: Session | null) => void): () => void {
    if (this.isInitialized) {
      console.warn('⚠️ AuthSession: Already initialized, skipping duplicate initialization');
      return () => {}; // Return empty cleanup function
    }

    console.log('🚀 AuthSession: Initializing singleton auth manager');
    this.isInitialized = true;
    this.setupVisibilityHandlers();

    // Set up the single auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔧 AuthSession: Auth state change:', event, !!session);
      
      this.currentSession = session;
      
      // Handle session changes
      if (session) {
        this.setupSessionRefreshTimer(session);
        if (event === 'SIGNED_IN') {
          this.broadcastMessage('SIGNED_IN', { userId: session.user?.id });
        }
      } else {
        this.clearRefreshTimer();
        if (event === 'SIGNED_OUT') {
          this.broadcastMessage('SIGNED_OUT', { reason: 'Local signout' });
        }
      }
      
      // Emit to listeners
      this.emit('session-changed', { session, user: session?.user || null, event });
      
      // Call the provided callback
      onAuthStateChange(event, session);
    });

    this.subscriptionActive = true;

    // Return cleanup function
    return () => {
      console.log('🧹 AuthSession: Cleaning up singleton manager');
      subscription.unsubscribe();
      this.clearRefreshTimer();
      this.removeVisibilityHandlers();
      this.subscriptionActive = false;
      this.isInitialized = false;
    };
  }

  // Event system for cross-component communication
  on<K extends keyof AuthEvents>(event: K, handler: (data: AuthEvents[K]) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<K extends keyof AuthEvents>(event: K, handler: (data: AuthEvents[K]) => void) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit<K extends keyof AuthEvents>(event: K, data: AuthEvents[K]) {
    this.eventHandlers.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`❌ AuthSession: Error in event handler for ${event}:`, error);
      }
    });
  }

  // Check if token is close to expiry (within 5 minutes)
  isTokenNearExpiry(session: Session | null): boolean {
    if (!session?.expires_at) return false;
    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    return (expiresAt - now) < 300000; // 5 minutes
  }

  // Force cleanup (for signOut)
  cleanup() {
    this.clearRefreshTimer();
    this.currentSession = null;
    this.broadcastMessage('SIGNED_OUT', { reason: 'Force cleanup' });
  }

  // Check if manager is properly initialized
  get initialized(): boolean {
    return this.isInitialized && this.subscriptionActive;
  }

  // Broadcast profile update to other tabs
  broadcastProfileUpdate(userId: string, profile: any) {
    this.broadcastMessage('PROFILE_UPDATED', { userId, profile });
  }
}

export const authSessionManager = AuthSessionManager.getInstance();