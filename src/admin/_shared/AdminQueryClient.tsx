import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useMemo } from "react";

interface AdminQueryClientProps {
  children: ReactNode;
}

export function AdminQueryClient({ children }: AdminQueryClientProps) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,          // 5 минут «свежести» для админки
            gcTime: 10 * 60 * 1000,            // 10 минут в кэше
            refetchOnWindowFocus: false,        // 🔑 отключаем авто-рефетч по фокусу
            refetchOnReconnect: true,
            retry: 2,
            refetchOnMount: 'always',          // Always refetch on mount but not on focus
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}