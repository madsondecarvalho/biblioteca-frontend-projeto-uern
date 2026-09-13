"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/guards";
import { useAuth } from "@/lib/auth-context";
import { useBooks, useCopies, useReservations, useUsers } from "@/lib/hooks";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardContent() {
  const { isAdmin } = useAuth();
  const books = useBooks({ page: 1, limit: 1 });
  const copiesAvailable = useCopies({ page: 1, limit: 1, status: "AVAILABLE" });
  const myPending = useReservations({ page: 1, limit: 1, status: "PENDING" });
  const users = useUsers(1, 1);

  const loading = books.isLoading || copiesAvailable.isLoading || myPending.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            Visão geral da biblioteca. Retiradas são presenciais; reservas expiram em 24h.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/books">
            <Button>Ver catálogo</Button>
          </Link>
          <Link href="/reservations">
            <Button variant="outline">Minhas reservas</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton /><Skeleton /><Skeleton /><Skeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardTitle>Total de livros</CardTitle>
            <CardValue>{books.data?.pagination.total ?? "—"}</CardValue>
            <Link href="/books" className="mt-2 inline-block text-sm underline">
              Explorar
            </Link>
          </Card>
          <Card>
            <CardTitle>Cópias disponíveis</CardTitle>
            <CardValue>{copiesAvailable.data?.pagination.total ?? "—"}</CardValue>
            <Link href="/copies" className="mt-2 inline-block text-sm underline">
              Ver cópias
            </Link>
          </Card>
          <Card>
            <CardTitle>Minhas reservas pendentes</CardTitle>
            <CardValue>{myPending.data?.pagination.total ?? "—"}</CardValue>
            <Link href="/reservations" className="mt-2 inline-block text-sm underline">
              Gerenciar
            </Link>
          </Card>
          {isAdmin && (
            <Card>
              <CardTitle>Total de usuários</CardTitle>
              <CardValue>{users.data?.pagination.total ?? "—"}</CardValue>
              <Link href="/users" className="mt-2 inline-block text-sm underline">
                Administrar
              </Link>
            </Card>
          )}
        </div>
      )}

      <Card>
        <h2 className="font-semibold">Como funciona a reserva</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Encontre o livro em /books e abra o detalhe.</li>
          <li>Reserve uma cópia com status AVAILABLE — ela fica RESERVED por 24h.</li>
          <li>Retire presencialmente; o admin confirma (PICKED_UP → BORROWED).</li>
          <li>O admin também pode cancelar ou marcar como expirada (→ AVAILABLE).</li>
        </ol>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
