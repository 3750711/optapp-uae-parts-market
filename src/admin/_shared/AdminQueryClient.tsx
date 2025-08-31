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
            staleTime: 5 * 60 * 1000,     // данные «свежие» 5 минут
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,  // не дёргаем при фокусе
            refetchOnReconnect: false,    // и при реконнекте — админка не «скачет»
            retry: 1,
            refetchOnMount: false,        // 🔑 не перезагружаем при каждом входе в страницу
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