import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

/**
 * Cria uma Promise já resolvida com o formato que o React `use()` reconhece.
 * Sem o status "fulfilled", o Suspense fica preso no fallback durante o teste.
 */
export function fulfilled<T>(value: T): Promise<T> {
  const promise = Promise.resolve(value) as Promise<T> & {
    status: string;
    value: T;
  };
  promise.status = "fulfilled";
  promise.value = value;
  return promise;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    queryClient,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
