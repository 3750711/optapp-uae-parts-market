import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { cleanupCorruptedCache } from './utils/localStorage';
import { quarantineStaleRefreshTokens } from './auth/quarantineStaleRefresh';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from './config/runtimeSupabase';
import { registerServiceWorker } from './utils/serviceWorkerManager';

import './index.css';

// Clean up any corrupted localStorage data on app start
cleanupCorruptedCache();

// Debug logging for runtime config verification
const runtimeConfig = {
  url: getRuntimeSupabaseUrl(),
  anonRef: (() => {
    try {
      const anonKey = getRuntimeAnonKey();
      if (!anonKey) return null;
      const [, payload] = anonKey.split('.');
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).ref;
    } catch {
      return null;
    }
  })()
};
console.info('🔍 Supabase runtime config:', runtimeConfig);

// Auto-quarantine stale refresh tokens BEFORE mounting React app
quarantineStaleRefreshTokens().then(() => {
  console.log('🧹 Token quarantine check completed');
}).catch(err => {
  console.warn('⚠️ Token quarantine check failed:', err);
});

// Register Service Worker for PWA functionality
registerServiceWorker();
console.log('[PWA] Registration attempted');

// Supabase client uses adaptive dual-domain connection
console.log('🌍 Supabase Client initialized with custom domain');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Не повторяем при авторизационных ошибках
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    }
  },
});

class ErrorBoundary extends React.Component<{children: React.ReactNode},{hasError:boolean}> {
  constructor(props: any) { 
    super(props); 
    this.state = {hasError: false}; 
  }
  
  static getDerivedStateFromError() { 
    return {hasError: true}; 
  }
  
  render() { 
    return this.state.hasError ? 
      <div style={{padding: 16}}>Что-то пошло не так. Обновите страницу.</div> : 
      this.props.children; 
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
