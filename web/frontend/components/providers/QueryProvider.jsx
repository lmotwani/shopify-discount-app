import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

export function QueryProvider({ children }) {
  const client = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          cacheTime: 1000 * 60 * 60 * 24, // 24 hours
          retry: 1,
        },
      },
    });
  }, []);

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
