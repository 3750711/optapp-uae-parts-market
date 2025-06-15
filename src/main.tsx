
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { initPerformanceOptimizations } from "@/utils/performanceUtils";
import { preloadCriticalRoutes } from "@/utils/lazyRoutes";

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

// Запускаем приложение
initApp();
// Инициализируем мониторинг производительности
initPerformanceOptimizations();
// Предзагружаем критические маршруты
preloadCriticalRoutes();
