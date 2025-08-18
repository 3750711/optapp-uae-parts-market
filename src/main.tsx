
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPerformanceOptimizations } from "@/utils/performanceUtils";
import { initializeClarity } from "@/utils/clarityTracking";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";
import { registerServiceWorker } from "@/utils/serviceWorkerManager";

// Import PWA optimizations early for better bfcache handling
import "@/utils/pwaOptimizations";

// Импортируем системы мониторинга для продакшена
import "@/utils/productionErrorReporting";

// Safe app initialization with proper error handling
const initApp = async () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  try {
    // Initialize PWA and mobile optimizations first
    initMobileOptimizations();
    
    // Register service worker for PWA functionality
    registerServiceWorker();
    
    // Create root and render app
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    // Initialize monitoring after app is mounted
    initPerformanceOptimizations();
    initializeClarity();
    
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    throw error;
  }
};

// Production checks
const performProductionChecks = () => {
  if (import.meta.env.PROD) {
    // Production mode - disable console.log for performance
    console.log = () => {};
  }
};

// Improved global error handling without forced reloads
const handleGlobalError = (event: ErrorEvent) => {
  console.error('[GLOBAL]', event.error?.message || 'Unknown error');
  
  // Handle chunk loading errors with better recovery
  if (event.error?.message?.includes('Loading chunk') || 
      event.error?.message?.includes('dynamically imported module')) {
    
    console.log('🔄 Handling chunk loading error...');
    
    // Show user-friendly error without immediate reload
    showChunkErrorDialog();
  }
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('[PROMISE]', event.reason?.message || 'Unhandled rejection');
  
  // Prevent console spam for known safe errors
  if (event.reason?.message?.includes('ResizeObserver loop limit exceeded')) {
    event.preventDefault();
  }
};

// User-friendly error dialog instead of forced reload
const showChunkErrorDialog = () => {
  const existingDialog = document.getElementById('chunk-error-dialog');
  if (existingDialog) return; // Don't show multiple dialogs
  
  const dialog = document.createElement('div');
  dialog.id = 'chunk-error-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    z-index: 10000;
    max-width: 400px;
    text-align: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  dialog.innerHTML = `
    <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600;">Обновление приложения</h3>
    <p style="margin: 0 0 1.5rem 0; color: #6b7280;">Доступна новая версия. Нажмите "Обновить" для продолжения работы.</p>
    <button id="refresh-btn" style="
      background: #3b82f6;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
    ">Обновить</button>
  `;
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(dialog);
  
  document.getElementById('refresh-btn')?.addEventListener('click', async () => {
    try {
      // Clear caches
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
    } catch (error) {
      console.warn('Could not clear caches:', error);
    } finally {
      window.location.reload();
    }
  });
};

// Safe event listener setup
if (typeof window !== 'undefined') {
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

// Initialize app with proper error boundaries
(async () => {
  try {
    performProductionChecks();
    await initApp();
  } catch (error) {
    console.error('[INIT] Critical initialization error:', error);
    
    // Show fallback UI for critical errors
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          background-color: #f9fafb;
          color: #374151;
        ">
          <div style="text-align: center; max-width: 500px; padding: 2rem;">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
              Ошибка инициализации
            </h1>
            <p style="margin-bottom: 2rem; color: #6b7280;">
              Не удалось запустить приложение. Попробуйте обновить страницу.
            </p>
            <button onclick="window.location.reload()" style="
              background-color: #3b82f6;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
            ">
              Обновить страницу
            </button>
          </div>
        </div>
      `;
    }
  }
})();
