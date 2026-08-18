"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/contexts/auth-context";

// Polyfill to support error.response?.data?.message format used by legacy axios handlers
if (typeof window !== "undefined") {
  if (!("response" in Error.prototype)) {
    Object.defineProperty(Error.prototype, "response", {
      get() {
        return {
          data: {
            message: this.message,
          },
        };
      },
      configurable: true,
    });
  }

  // Prevent raw DOM Events from bubbling up to Next.js error boundary as "[object Event]"
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason instanceof Event || !event.reason) {
      event.preventDefault();
    }
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
