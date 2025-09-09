import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { cleanupCorruptedCache } from './utils/localStorage';
import { quarantineStaleRefreshTokens } from './auth/quarantineStaleRefresh';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from './config/runtimeSupabase';
import { registerServiceWorker } from './utils/serviceWorkerManager';
import { ModuleLoadingBoundary } from './components/ModuleLoadingBoundary';
import { ReactReadinessWrapper } from './components/ReactReadinessWrapper';

import './index.css';

// Log successful module loading for diagnostics
console.log('✅ Main modules loaded successfully');
console.log('📦 Module loading diagnostics:', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  connection: (navigator as any).connection?.effectiveType || 'unknown'
});

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

// QueryClient перенесён в App.tsx для единой конфигурации

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

// Check React dispatcher readiness before any React rendering
const checkReactDispatcher = () => {
  try {
    const ReactInternals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    const dispatcher = ReactInternals?.ReactCurrentDispatcher?.current;
    return dispatcher !== null && typeof React.useState === 'function';
  } catch (error) {
    console.warn('React dispatcher check failed:', error);
    return false;
  }
};

const initializeApp = (attempt = 1) => {
  const maxAttempts = 100; // 10 seconds max wait
  
  console.log(`[ReactInit] Checking dispatcher readiness (attempt ${attempt}/${maxAttempts})`);
  
  if (checkReactDispatcher()) {
    console.log('✅ [ReactInit] React dispatcher ready, rendering app');
    
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ModuleLoadingBoundary>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ModuleLoadingBoundary>
      </React.StrictMode>
    );
  } else if (attempt < maxAttempts) {
    console.warn(`⚠️ [ReactInit] Dispatcher not ready, retrying in 100ms (${attempt}/${maxAttempts})`);
    
    // Update loading indicator with native DOM
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">
          <div style="text-align: center;">
            <div style="margin-bottom: 16px; font-size: 18px;">Инициализация React...</div>
            <div style="font-size: 14px; color: #666;">Попытка ${attempt} из ${maxAttempts}</div>
          </div>
        </div>
      `;
    }
    
    setTimeout(() => initializeApp(attempt + 1), 100);
  } else {
    console.error('❌ [ReactInit] React dispatcher not ready after maximum attempts');
    
    // Show error UI with native DOM
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">
          <div style="text-align: center; max-width: 400px; padding: 24px;">
            <h2 style="color: #dc2626; margin-bottom: 16px;">Ошибка инициализации React</h2>
            <p style="margin-bottom: 20px; color: #666;">React dispatcher не готов после ${maxAttempts} попыток.</p>
            <button onclick="window.location.reload()" 
                    style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
              Обновить страницу
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Start initialization process - no React hooks involved until dispatcher is ready
initializeApp();
