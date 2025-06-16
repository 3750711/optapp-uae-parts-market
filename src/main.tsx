
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { initPerformanceOptimizations } from "@/utils/performanceUtils";
import { preloadCriticalRoutes } from "@/utils/lazyRoutes";

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
      <Toaster />
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

// Запускаем приложение
performProductionChecks();
initApp();

// Инициализируем мониторинг производительности
initPerformanceOptimizations();

// Предзагружаем критические маршруты
preloadCriticalRoutes();
