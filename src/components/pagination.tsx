"use client";

import { Button } from "./ui/button";
import type { Pagination as PaginationType } from "@/lib/types";

export function Pagination({
  pagination,
  onChange,
}: {
  pagination?: PaginationType;
  onChange: (page: number) => void;
}) {
  if (!pagination) return null;
  const { page, totalPages, total, limit } = pagination;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span>
        Página {page} de {totalPages} — {total} registro(s) ({limit} por página)
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
