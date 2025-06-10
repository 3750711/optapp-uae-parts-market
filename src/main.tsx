
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { errorMonitor } from "@/utils/errorMonitoring";

// Initialize error monitoring
console.log('🔍 Error monitoring initialized');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>
);
