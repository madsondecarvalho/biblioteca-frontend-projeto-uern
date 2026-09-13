"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards";
import { useAuth } from "@/lib/auth-context";
import { useReservations } from "@/lib/hooks";
import {
  deleteReservation,
  updateReservationStatus,
} from "@/lib/services";
import { formatDateBR } from "@/lib/utils";
import { getApiErrorMessage, type ReservationStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Table, Thead, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";

const FILTERS: (ReservationStatus | "")[] = ["", "PENDING", "PICKED_UP", "CANCELLED", "EXPIRED"];

function ReservationsContent() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [acting, setActing] = useState<number | null>(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      status: (status || undefined) as ReservationStatus | undefined,
    }),
    [page, status]
  );

  const { data, isLoading } = useReservations(filters);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    queryClient.invalidateQueries({ queryKey: ["copies"] });
  }

  async function changeStatus(id: number, s: "PICKED_UP" | "CANCELLED" | "EXPIRED") {
    setActing(id);
    try {
      await updateReservationStatus(id, s);
      toast.success(`Reserva ${s === "PICKED_UP" ? "confirmada (retirada)" : s === "CANCELLED" ? "cancelada" : "marcada como expirada"}`);
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao atualizar reserva"));
    } finally {
      setActing(null);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteReservation(deletingId);
      toast.success("Reserva removida");
      setDeletingId(null);
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover reserva"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-sm text-zinc-500">
          {isAdmin
            ? "Admin vê todas. Ações: Confirmar Retirada (PICKED_UP), Cancelar, Expirar, Excluir."
            : "Você vê apenas as suas reservas. Reserva expira em 24h."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          {FILTERS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          Limpar filtro
        </Button>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : (
        <Card className="p-0">
          <Table>
            <Thead>
              <tr>
                <Th>ID</Th>
                <Th>Cópia / Livro</Th>
                {isAdmin && <Th>Usuário</Th>}
                <Th>Status</Th>
                <Th>Reservada em</Th>
                <Th>Expira em</Th>
                <Th>Ações (admin)</Th>
              </tr>
            </Thead>
            <tbody>
              {(data?.data ?? []).map((r) => (
                <tr key={r.id}>
                  <Td>{r.id}</Td>
                  <Td>
                    <span className="font-medium">{r.Copy?.code ?? `#${r.copyId}`}</span>
                    <br />
                    <span className="text-xs text-zinc-500">
                      {r.Copy?.Book?.title ?? ""}
                    </span>
                  </Td>
                  {isAdmin && (
                    <Td>{r.User ? `${r.User.name} (${r.User.email})` : `#${r.userId}`}</Td>
                  )}
                  <Td>
                    <Badge status={r.status}>{r.status}</Badge>
                  </Td>
                  <Td>{formatDateBR(r.reservedAt ?? r.createdAt)}</Td>
                  <Td>{formatDateBR(r.expiresAt)}</Td>
                  <Td>
                    {isAdmin ? (
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          disabled={acting === r.id || r.status !== "PENDING"}
                          onClick={() => changeStatus(r.id, "PICKED_UP")}
                        >
                          Confirmar retirada
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={acting === r.id || r.status !== "PENDING"}
                          onClick={() => changeStatus(r.id, "CANCELLED")}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={acting === r.id || r.status !== "PENDING"}
                          onClick={() => changeStatus(r.id, "EXPIRED")}
                        >
                          Expirar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingId(r.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {(data?.data ?? []).length === 0 && !isLoading && (
        <p className="text-sm text-zinc-500">Nenhuma reserva encontrada.</p>
      )}

      <Pagination pagination={data?.pagination} onChange={setPage} />

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remover reserva"
        description="Tem certeza que deseja remover esta reserva? (admin only)"
      />
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <RequireAuth>
      <ReservationsContent />
    </RequireAuth>
  );
}
