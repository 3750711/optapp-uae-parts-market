
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Debug: Check React version consistency - ДОЛЖЕН БЫТЬ ВИДЕН В КОНСОЛИ!
console.log("🔍 [React main]", React.version, "URL:", import.meta.url);
console.log("🔍 React export keys:", Object.keys(React));
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

// Оптимизированная инициализация приложения
const initApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  // Создаем root только один раз
  const root = createRoot(rootElement);
  
  // Рендерим приложение
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
};

// Проверка готовности к продакшену
const performProductionChecks = () => {
  if (import.meta.env.PROD) {
    // Production mode - disable console.log for performance
    console.log = () => {};
  }
};

// Глобальная обработка неперехваченных ошибок
const handleGlobalError = (event: ErrorEvent) => {
  console.error('[GLOBAL]', event.error?.message || 'Unknown error');
  
  // Автоматическое восстановление при ошибках загрузки модулей
  if (event.error?.message?.includes('Loading chunk') || 
      event.error?.message?.includes('dynamically imported module')) {
    
    // Безопасная очистка кешей с проверкой типов
    const clearCachesAndReload = async () => {
      try {
        if (typeof window !== 'undefined' && 'caches' in window && window.caches) {
          const names = await window.caches.keys();
          await Promise.all(names.map(name => window.caches.delete(name)));
        }
        } catch (error) {
        // Silently handle cache clearing errors
      } finally {
        // Безопасная перезагрузка страницы
        if (typeof window !== 'undefined' && window.location) {
          window.location.reload();
        }
      }
    };
    
    clearCachesAndReload();
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
  
  // Register service worker for PWA functionality
  registerServiceWorker();
  
  initApp();
  
  // Инициализируем мониторинг производительности
  initPerformanceOptimizations();
  
  // Инициализируем Microsoft Clarity (только в продакшене)
  initializeClarity();
} catch (error) {
  console.error('[INIT]', 'Failed to initialize app');
  
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
