"use client";

import { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth-context";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useRequireAuth(false);
  if (isLoading || !isAuthenticated) {
    return <p className="p-8 text-sm text-zinc-500">Carregando...</p>;
  }
  return <>{children}</>;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, isAdmin } = useRequireAuth(true);
  if (isLoading || !isAuthenticated || !isAdmin) {
    return <p className="p-8 text-sm text-zinc-500">Verificando permissão...</p>;
  }
  return <>{children}</>;
}
