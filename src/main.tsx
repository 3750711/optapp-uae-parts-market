import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Production mode optimization
if (import.meta.env.DEV) {
  console.log("🔍 React version:", React.version);
}

import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { initPerformanceOptimizations } from "@/utils/performanceUtils";
import { initializeClarity } from "@/utils/clarityTracking";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";
import { registerServiceWorker } from "@/utils/serviceWorkerManager";

// Import PWA optimizations early for better bfcache handling
import "@/utils/pwaOptimizations";

// Импортируем системы мониторинга для продакшена
import "@/utils/productionErrorReporting";

const initApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  // Создаем root только один раз
  const root = createRoot(rootElement);
  
  // Рендерим приложение
  // Use StrictMode only in development to avoid double initialization
  const Shell = ({ children }: { children: React.ReactNode }) =>
    import.meta.env.DEV ? <StrictMode>{children}</StrictMode> : <>{children}</>;

  root.render(
    <Shell>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Shell>
  );
};

const performProductionChecks = () => {
  if (import.meta.env.PROD) {
    // Production mode - disable console.log for performance
    console.log = () => {};
  }
};

const handleGlobalError = (event: ErrorEvent) => {
  console.error('[GLOBAL]', event.error?.message || 'Unknown error');
  
  // Автоматическое восстановление при ошибках загрузки модулей
  if (event.error?.message?.includes('Loading chunk') || 
      event.error?.message?.includes('dynamically imported module')) {
    
    // Soft recovery instead of immediate reload
    console.log('🔄 Detected chunk loading error, attempting soft recovery...');
    
    const trySoftRecover = async () => {
      try {
        // Try to update SW registration first
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
          }
        }
      } catch (error) {
        console.warn('SW update failed during recovery:', error);
      }
      
      // Show recoverable error banner with delay to prevent spam
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('app:recoverable-chunk-error', {
          detail: { message: event.error?.message }
        }));
      }, 1000);
    };
    
    trySoftRecover();
  }
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('[PROMISE]', event.reason?.message || 'Unhandled rejection');
  
  // Предотвращаем показ ошибки в консоли для известных безопасных ошибок
  if (event.reason?.message?.includes('ResizeObserver loop limit exceeded')) {
    event.preventDefault();
  }
};

// Безопасная установка обработчиков событий
if (typeof window !== 'undefined') {
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

// Запускаем приложение
try {
  performProductionChecks();
  
  // Initialize PWA and mobile optimizations first
  initMobileOptimizations();
  
  // Register service worker for PWA functionality (prod only)
  if (import.meta.env.PROD) {
    registerServiceWorker().catch(error => {
      console.warn('SW registration failed:', error);
      // Не блокируем работу приложения при неудаче регистрации SW
    });
  }
  
  initApp();
  
  // Инициализируем мониторинг производительности
  initPerformanceOptimizations();
  
  // Инициализируем Microsoft Clarity (только в продакшене)
  initializeClarity();
} catch (error) {
  console.error('[INIT]', 'Failed to initialize app', error);
  
  // Показываем пользователю сообщение об ошибке безопасным способом
  if (typeof document !== 'undefined') {
    // Очищаем body от существующего контента
    document.body.innerHTML = '';
    
    // Создаем контейнер безопасным способом
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f9fafb;
      color: #374151;
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'text-align: center; max-width: 500px; padding: 2rem;';
    
    const title = document.createElement('h1');
    title.style.cssText = 'font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;';
    title.textContent = 'Ошибка загрузки приложения';
    
    const message = document.createElement('p');
    message.style.cssText = 'margin-bottom: 2rem; color: #6b7280;';
    message.textContent = 'Произошла ошибка при инициализации. Попробуйте обновить страницу.';
    
    const reloadButton = document.createElement('button');
    reloadButton.style.cssText = `
      background-color: #3b82f6;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
    `;
    reloadButton.textContent = 'Обновить страницу';
    reloadButton.addEventListener('click', () => window.location.reload());
    
    contentDiv.appendChild(title);
    contentDiv.appendChild(message);
    contentDiv.appendChild(reloadButton);
    errorContainer.appendChild(contentDiv);
    document.body.appendChild(errorContainer);
  }
}
