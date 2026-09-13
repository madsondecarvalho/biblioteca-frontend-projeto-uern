"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/lib/hooks";
import { createCategory, deleteCategory, updateCategory } from "@/lib/services";
import { categorySchema, type CategoryForm } from "@/lib/schemas";
import { getApiErrorMessage, type Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Table, Thead, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";

function CategoriesContent() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCategories(page, 10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "" });
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    form.reset({ name: c.name });
    setModalOpen(true);
  }

  async function onSubmit(values: CategoryForm) {
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, values);
        toast.success("Categoria atualizada");
      } else {
        await createCategory(values);
        toast.success("Categoria criada");
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar categoria"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteCategory(deletingId);
      toast.success("Categoria removida");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover categoria"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-zinc-500">GET /categories paginado. Escrita restrita a admin.</p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Nova Categoria</Button>}
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
              {(data?.data ?? []).map((c) => (
                <tr key={c.id}>
                  <Td>{c.id}</Td>
                  <Td className="font-medium">{c.name}</Td>
                  {isAdmin && (
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingId(c.id)}>
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
        <p className="text-sm text-zinc-500">Nenhuma categoria encontrada.</p>
      )}

      <Pagination pagination={data?.pagination} onChange={setPage} />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar categoria" : "Nova categoria"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input placeholder="Policial" {...form.register("name")} />
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
        title="Remover categoria"
        description="Tem certeza que deseja remover esta categoria?"
      />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <RequireAuth>
      <CategoriesContent />
    </RequireAuth>
  );
}
