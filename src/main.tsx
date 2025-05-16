
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from "@/hooks/use-toast"
import React from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Create a client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once
      retryDelay: 500, // Wait 500ms before retrying
      staleTime: 60000, // Data remains fresh for 1 minute
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
