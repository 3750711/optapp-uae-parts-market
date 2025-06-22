
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
    console.log('🚀 Production mode detected');
    
    // Проверяем наличие критических переменных окружения
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_CLOUDINARY_CLOUD_NAME'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // Отключаем console.log в продакшене (оставляем warn и error)
    if (import.meta.env.VITE_DISABLE_CONSOLE_LOGS === 'true') {
      console.log = () => {};
    }
  }
};

// Глобальная обработка неперехваченных ошибок
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Автоматическое восстановление при ошибках загрузки модулей
  if (event.error?.message?.includes('Loading chunk') || 
      event.error?.message?.includes('dynamically imported module')) {
    console.log('🔄 Chunk loading error detected, attempting recovery...');
    
    // Очищаем кеши и перезагружаем
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Предотвращаем показ ошибки в консоли для известных безопасных ошибок
  if (event.reason?.message?.includes('ResizeObserver loop limit exceeded')) {
    event.preventDefault();
  }
});

// Запускаем приложение
try {
  performProductionChecks();
  initApp();
  
  // Инициализируем мониторинг производительности
  initPerformanceOptimizations();
} catch (error) {
  console.error('Failed to initialize app:', error);
  
  // Показываем пользователю сообщение об ошибке
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
