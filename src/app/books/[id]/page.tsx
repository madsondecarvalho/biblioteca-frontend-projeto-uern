"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards";
import { useAuth } from "@/lib/auth-context";
import { useBook, useCopies } from "@/lib/hooks";
import { createReservation } from "@/lib/services";
import { formatDateBR } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Thead, Th, Td } from "@/components/ui/table";

function DetailContent({ id }: { id: string }) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [reserving, setReserving] = useState<number | null>(null);
  const book = useBook(id);
  const copies = useCopies({ bookId: Number(id), page: 1, limit: 50 });

  async function handleReserve(copyId: number) {
    setReserving(copyId);
    try {
      await createReservation({ copyId });
      toast.success("Cópia reservada por 24h! Veja em /reservations.");
      queryClient.invalidateQueries({ queryKey: ["copies"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cópia não está disponível"));
    } finally {
      setReserving(null);
    }
  }

  if (book.isLoading) return <Skeleton className="h-64" />;
  if (book.isError || !book.data)
    return <p className="text-sm text-red-600">Livro não encontrado.</p>;

  const b = book.data;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/books" className="text-sm underline">
        ← Voltar ao catálogo
      </Link>
      <Card>
        <h1 className="text-2xl font-bold">{b.title}</h1>
        <p className="text-sm text-zinc-500">
          {b.Author?.name ?? `Autor #${b.authorId}`} • {b.year} •{" "}
          {b.Category?.name ?? "Sem categoria"}
        </p>
        {isAdmin && (
          <div className="mt-3 flex gap-2">
            <Link href={`/books/${b.id}/edit`}>
              <Button size="sm" variant="outline">
                Editar
              </Button>
            </Link>
          </div>
        )}
      </Card>

      <h2 className="text-lg font-semibold">
        Cópias (GET /copies?bookId={b.id})
      </h2>
      {copies.isLoading ? (
        <Skeleton />
      ) : copies.data && copies.data.data.length > 0 ? (
        <Table>
          <Thead>
            <tr>
              <Th>Código</Th>
              <Th>Status</Th>
              <Th>Atualizada em</Th>
              <Th>Ação</Th>
            </tr>
          </Thead>
          <tbody>
            {copies.data.data.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.code}</Td>
                <Td>
                  <Badge status={c.status}>{c.status}</Badge>
                </Td>
                <Td>{formatDateBR(c.updatedAt)}</Td>
                <Td>
                  {c.status === "AVAILABLE" ? (
                    <Button
                      size="sm"
                      disabled={reserving === c.id}
                      onClick={() => handleReserve(c.id)}
                    >
                      {reserving === c.id ? "Reservando..." : "Reservar"}
                    </Button>
                  ) : (
                    <span className="text-xs text-zinc-400">Indisponível</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-sm text-zinc-500">Nenhuma cópia cadastrada para este livro.</p>
      )}
    </div>
  );
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <DetailContent id={id} />
    </RequireAuth>
  );
}
