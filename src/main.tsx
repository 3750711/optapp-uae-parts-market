
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Safe app initialization with proper error handling
const initApp = async () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  try {
    // Create root and render app
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

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

// Improved global error handling
const handleGlobalError = (event: ErrorEvent) => {
  console.error('[GLOBAL ERROR]', event.error?.message || 'Unknown error', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('[UNHANDLED PROMISE]', event.reason?.message || 'Unhandled rejection');
  
  // Prevent console spam for known safe errors
  if (event.reason?.message?.includes('ResizeObserver loop limit exceeded')) {
    event.preventDefault();
  }
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
