
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/SimpleAuthContext";
import { ProfileProvider } from "@/contexts/ProfileProvider";
import { routeConfigs } from "@/utils/lazyRoutes";
import SimpleProtectedRoute from "./components/auth/SimpleProtectedRoute";
import { SimpleAdminRoute } from "./components/auth/SimpleAdminRoute";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Loading component for lazy-loaded routes
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {routeConfigs.map((route, index) => {
                  const Component = route.component;
                  
                  // Create the route element based on protection requirements
                  let routeElement;
                  
                  if (route.adminOnly) {
                    // Admin-only routes
                    routeElement = (
                      <SimpleAdminRoute>
                        <Component />
                      </SimpleAdminRoute>
                    );
                  } else if (route.protected) {
                    // Protected routes (requires authentication)
                    routeElement = (
                      <SimpleProtectedRoute>
                        <Component />
                      </SimpleProtectedRoute>
                    );
                  } else {
                    // Public routes
                    routeElement = <Component />;
                  }
                  
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={routeElement}
                    />
                  );
                })}
              </Routes>
            </Suspense>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
