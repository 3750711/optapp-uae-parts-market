
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { perfMark, perfMeasure, initPerformanceOptimizations } from "@/utils/performanceUtils";

// Маркируем начало инициализации
perfMark('app-init-start');

// Ленивая инициализация мониторинга ошибок только в продакшене
const initErrorMonitoring = async () => {
  if (process.env.NODE_ENV === 'production') {
    try {
      // Динамический импорт только когда нужно
      const { errorMonitor } = await import("@/utils/errorMonitoring");
      console.log('🔍 Error monitoring initialized');
      return errorMonitor;
    } catch (error) {
      console.warn('Failed to initialize error monitoring:', error);
    }
  }
};

// Оптимизированная инициализация с мониторингом производительности
const initApp = () => {
  perfMark('dom-setup-start');
  
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  // Создаем root только один раз
  const root = createRoot(rootElement);
  
  perfMark('dom-setup-end');
  perfMark('react-render-start');
  
  // Рендерим приложение
  root.render(
    <StrictMode>
      <App />
      <Toaster />
    </StrictMode>
  );

  perfMark('react-render-end');
  
  // Измеряем производительность
  perfMeasure('DOM Setup', 'dom-setup-start', 'dom-setup-end');
  perfMeasure('React Render', 'react-render-start', 'react-render-end');
  perfMeasure('Total App Init', 'app-init-start', 'react-render-end');

  // Инициализируем оптимизации производительности
  initPerformanceOptimizations();

  // Инициализируем мониторинг после рендера (неблокирующе)
  if (process.env.NODE_ENV === 'production') {
    // Используем requestIdleCallback если доступен, иначе setTimeout
    const scheduleInit = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 16));
    scheduleInit(() => {
      initErrorMonitoring();
    });
  }
};

// Запускаем приложение
initApp();
