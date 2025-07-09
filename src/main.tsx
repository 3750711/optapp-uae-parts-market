
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPerformanceOptimizations } from "@/utils/performanceUtils";

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
      <App />
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
  initApp();
  
  // Инициализируем мониторинг производительности
  initPerformanceOptimizations();
} catch (error) {
  console.error('[INIT]', 'Failed to initialize app');
  
  // Показываем пользователю сообщение об ошибке
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
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
            Ошибка загрузки приложения
          </h1>
          <p style="margin-bottom: 2rem; color: #6b7280;">
            Произошла ошибка при инициализации. Попробуйте обновить страницу.
          </p>
          <button 
            onclick="window.location.reload()"
            style="
              background-color: #3b82f6;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
            "
          >
            Обновить страницу
          </button>
        </div>
      </div>
    `;
  }
}
