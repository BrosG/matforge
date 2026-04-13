"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/core/ThemeProvider";
import { ApiStatusProvider } from "@/lib/api-status";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: (failureCount, error: unknown) => {
              if (
                error &&
                typeof error === "object" &&
                "status" in error &&
                (error as { status: number }).status === 404
              )
                return false;
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <ApiStatusProvider>{children}</ApiStatusProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
