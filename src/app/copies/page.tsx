"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards";
import { useAuth } from "@/lib/auth-context";
import { useBooks, useCopies } from "@/lib/hooks";
import { createCopy, createReservation, deleteCopy, updateCopy } from "@/lib/services";
import { copySchema, type CopyForm } from "@/lib/schemas";
import { getApiErrorMessage, type Copy, type CopyStatus } from "@/lib/types";
import { formatDateBR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Table, Thead, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";

const STATUS_OPTIONS: (CopyStatus | "")[] = ["", "AVAILABLE", "RESERVED", "BORROWED", "MAINTENANCE", "LOST"];

function CopiesContent() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [bookId, setBookId] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Copy | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [reserving, setReserving] = useState<number | null>(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      bookId: bookId ? Number(bookId) : undefined,
      status: (status || undefined) as CopyStatus | undefined,
    }),
    [page, bookId, status]
  );

  const { data, isLoading } = useCopies(filters);
  const books = useBooks({ page: 1, limit: 100 });

  const form = useForm<CopyForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(copySchema) as any,
    defaultValues: { code: "", bookId: 0, status: "AVAILABLE" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ code: "", bookId: bookId ? Number(bookId) : 0, status: "AVAILABLE" });
    setModalOpen(true);
  }

  function openEdit(c: Copy) {
    setEditing(c);
    form.reset({ code: c.code, bookId: c.bookId, status: c.status });
    setModalOpen(true);
  }

  async function onSubmit(values: CopyForm) {
    setSaving(true);
    try {
      if (editing) {
        await updateCopy(editing.id, {
          code: values.code,
          bookId: Number(values.bookId),
          status: values.status,
        });
        toast.success("Cópia atualizada");
      } else {
        await createCopy({
          code: values.code,
          bookId: Number(values.bookId),
          status: values.status,
        });
        toast.success("Cópia criada");
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["copies"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar cópia"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteCopy(deletingId);
      toast.success("Cópia removida");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["copies"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover cópia"));
    }
  }

  async function handleReserve(copyId: number) {
    setReserving(copyId);
    try {
      await createReservation({ copyId });
      toast.success("Cópia reservada por 24h!");
      queryClient.invalidateQueries({ queryKey: ["copies"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cópia não está disponível"));
    } finally {
      setReserving(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cópias</h1>
          <p className="text-sm text-zinc-500">GET /copies?bookId=&status= — escrita restrita a admin.</p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Nova Cópia</Button>}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Select value={bookId} onChange={(e) => { setBookId(e.target.value); setPage(1); }}>
          <option value="">Todos os livros</option>
          {books.data?.data.map((b) => (
            <option key={b.id} value={b.id}>
              #{b.id} — {b.title}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setBookId("");
            setStatus("");
            setPage(1);
          }}
        >
          Limpar filtros
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
                <Th>Código</Th>
                <Th>Livro</Th>
                <Th>Status</Th>
                <Th>Atualizada em</Th>
                <Th>Ação</Th>
              </tr>
            </Thead>
            <tbody>
              {(data?.data ?? []).map((c) => (
                <tr key={c.id}>
                  <Td>{c.id}</Td>
                  <Td className="font-medium">{c.code}</Td>
                  <Td>{c.Book?.title ?? `#${c.bookId}`}</Td>
                  <Td>
                    <Badge status={c.status}>{c.status}</Badge>
                  </Td>
                  <Td>{formatDateBR(c.updatedAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {c.status === "AVAILABLE" && (
                        <Button
                          size="sm"
                          disabled={reserving === c.id}
                          onClick={() => handleReserve(c.id)}
                        >
                          {reserving === c.id ? "Reservando..." : "Reservar"}
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeletingId(c.id)}>
                            Excluir
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {(data?.data ?? []).length === 0 && !isLoading && (
        <p className="text-sm text-zinc-500">Nenhuma cópia encontrada.</p>
      )}

      <Pagination pagination={data?.pagination} onChange={setPage} />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar cópia" : "Nova cópia"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Código * (ex: BC-039)</label>
            <Input {...form.register("code")} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Livro *</label>
            <Select {...form.register("bookId")}>
              <option value={0}>Selecione...</option>
              {books.data?.data.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.id} — {b.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <Select {...form.register("status")}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="BORROWED">BORROWED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="LOST">LOST</option>
              <option value="RESERVED">RESERVED</option>
            </Select>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remover cópia"
        description="Tem certeza que deseja remover esta cópia?"
      />
    </div>
  );
}

export default function CopiesPage() {
  return (
    <RequireAuth>
      <CopiesContent />
    </RequireAuth>
  );
}
