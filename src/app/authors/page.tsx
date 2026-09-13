"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards";
import { useAuth } from "@/lib/auth-context";
import { useAuthors } from "@/lib/hooks";
import { createAuthor, deleteAuthor, updateAuthor } from "@/lib/services";
import { authorSchema, type AuthorForm } from "@/lib/schemas";
import { getApiErrorMessage, type Author } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Table, Thead, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";

function AuthorsContent() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuthors(page, 10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<AuthorForm>({
    resolver: zodResolver(authorSchema),
    defaultValues: { name: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "" });
    setModalOpen(true);
  }

  function openEdit(a: Author) {
    setEditing(a);
    form.reset({ name: a.name });
    setModalOpen(true);
  }

  async function onSubmit(values: AuthorForm) {
    setSaving(true);
    try {
      if (editing) {
        await updateAuthor(editing.id, values);
        toast.success("Autor atualizado");
      } else {
        await createAuthor(values);
        toast.success("Autor criado");
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar autor"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteAuthor(deletingId);
      toast.success("Autor removido");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover autor"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Autores</h1>
          <p className="text-sm text-zinc-500">GET /authors paginado. Escrita restrita a admin.</p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Novo Autor</Button>}
      </div>

      {isLoading ? (
        <Skeleton />
      ) : (
        <Card className="p-0">
          <Table>
            <Thead>
              <tr>
                <Th>ID</Th>
                <Th>Nome</Th>
                {isAdmin && <Th>Ações</Th>}
              </tr>
            </Thead>
            <tbody>
              {(data?.data ?? []).map((a) => (
                <tr key={a.id}>
                  <Td>{a.id}</Td>
                  <Td className="font-medium">{a.name}</Td>
                  {isAdmin && (
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingId(a.id)}>
                          Excluir
                        </Button>
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {(data?.data ?? []).length === 0 && !isLoading && (
        <p className="text-sm text-zinc-500">Nenhum autor encontrado.</p>
      )}

      <Pagination pagination={data?.pagination} onChange={setPage} />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar autor" : "Novo autor"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input placeholder="Clarice Lispector" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remover autor"
        description="Tem certeza que deseja remover este autor?"
      />
    </div>
  );
}

export default function AuthorsPage() {
  return (
    <RequireAuth>
      <AuthorsContent />
    </RequireAuth>
  );
}
