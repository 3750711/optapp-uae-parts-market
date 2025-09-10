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
import { runReactDiagnostics } from './utils/reactDiagnostics';

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

// Auto-quarantine stale refresh tokens BEFORE mounting React app (blocking)
const initializeTokens = async () => {
  try {
    await quarantineStaleRefreshTokens();
    console.log('🧹 Token quarantine check completed');
  } catch (err) {
    console.warn('⚠️ Token quarantine check failed:', err);
  }
};

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

// Module loading diagnostics for Service Worker issues
const logModuleLoadingState = () => {
  console.log('📊 [ModuleDiagnostics] Current loading state:', {
    timestamp: new Date().toISOString(),
    location: window.location.href,
    userAgent: navigator.userAgent,
    serviceWorkerSupport: 'serviceWorker' in navigator,
    serviceWorkerController: navigator.serviceWorker?.controller?.scriptURL || 'none',
    reactVersion: React.version,
    documentReadyState: document.readyState
  });
};

const initializeApp = async () => {
  logModuleLoadingState();
  console.log('✅ [ReactInit] Starting React app initialization');
  
  // Check React dispatcher readiness
  const diagnostics = runReactDiagnostics();
  if (diagnostics.internalState !== 'ready') {
    console.warn('⚠️ React dispatcher not ready, retrying...', diagnostics);
    await new Promise(resolve => setTimeout(resolve, 100));
    const retryDiagnostics = runReactDiagnostics();
    if (retryDiagnostics.internalState !== 'ready') {
      console.error('❌ React dispatcher still not ready after retry', retryDiagnostics);
    }
  }
  
  try {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ModuleLoadingBoundary>
          <ErrorBoundary>
            <ReactReadinessWrapper>
              <App />
            </ReactReadinessWrapper>
          </ErrorBoundary>
        </ModuleLoadingBoundary>
      </React.StrictMode>
    );
    
    console.log('✅ [ReactInit] React app initialized successfully');
    
    // Register Service Worker AFTER successful React initialization
    setTimeout(() => {
      registerServiceWorker();
      console.log('[PWA] Service Worker registered after React initialization');
    }, 1000);
    
  } catch (error) {
    console.error('❌ [ReactInit] Failed to initialize React app:', error);
    
    // Show error UI with native DOM
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">
          <div style="text-align: center; max-width: 400px; padding: 24px;">
            <h2 style="color: #dc2626; margin-bottom: 16px;">Ошибка загрузки приложения</h2>
            <p style="margin-bottom: 20px; color: #666;">Возможная проблема с Service Worker или загрузкой модулей.</p>
            <button onclick="
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  registrations.forEach(registration => registration.unregister());
                }).then(() => window.location.reload());
              } else {
                window.location.reload();
              }
            " style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
              Очистить SW и перезагрузить
            </button>
            <button onclick="window.location.reload()" 
                    style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
              Просто перезагрузить
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Start initialization process with proper sequencing
const startApp = async () => {
  await initializeTokens();
  await initializeApp();
};

startApp().catch(error => {
  console.error('❌ Failed to start app:', error);
});
