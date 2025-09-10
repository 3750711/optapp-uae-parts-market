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
            staleTime: 10 * 60 * 1000,    // данные «свежие» 10 минут (оптимизировано)
            gcTime: 30 * 60 * 1000,       // 30 минут (оптимизировано)
            refetchOnWindowFocus: false,  // не дёргаем при фокусе
            refetchOnReconnect: false,    // и при реконнекте — админка не «скачет»
            retry: 1,
            refetchOnMount: false,        // 🔑 не перезагружаем при каждом входе в страницу
            networkMode: 'online',        // только при наличии сети
            retryDelay: 2000,            // задержка между попытками 2 сек
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