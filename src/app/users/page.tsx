"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminGuard } from "@/components/guards";
import { useUsers } from "@/lib/hooks";
import { createUser, deleteUser, updateUser } from "@/lib/services";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateForm,
  type UserUpdateForm,
} from "@/lib/schemas";
import { getApiErrorMessage, type User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Table, Thead, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";

function UsersContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers(page, 10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const createForm = useForm<UserCreateForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userCreateSchema) as any,
    defaultValues: { name: "", email: "", password: "", role: "user" },
  });

  const editForm = useForm<UserUpdateForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userUpdateSchema) as any,
  });

  function openEdit(u: User) {
    setEditing(u);
    editForm.reset({ name: u.name, email: u.email, role: u.role });
  }

  async function onCreate(values: UserCreateForm) {
    setSaving(true);
    try {
      await createUser(values);
      toast.success("Usuário criado");
      setCreateOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao criar usuário"));
    } finally {
      setSaving(false);
    }
  }

  async function onEdit(values: UserUpdateForm) {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (values.name) payload.name = values.name;
      if (values.email) payload.email = values.email;
      if (values.password) payload.password = values.password;
      if (values.role) payload.role = values.role;
      await updateUser(editing.id, payload);
      toast.success("Usuário atualizado");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao atualizar usuário"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteUser(deletingId);
      toast.success("Usuário removido");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover usuário"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários (admin)</h1>
          <p className="text-sm text-zinc-500">GET/POST/PUT/DELETE /users — apenas administradores.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Novo Usuário</Button>
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
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Ações</Th>
              </tr>
            </Thead>
            <tbody>
              {(data?.data ?? []).map((u) => (
                <tr key={u.id}>
                  <Td>{u.id}</Td>
                  <Td className="font-medium">{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge status={u.role}>{u.role}</Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeletingId(u.id)}>
                        Excluir
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Pagination pagination={data?.pagination} onChange={setPage} />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Novo usuário">
        <form onSubmit={createForm.handleSubmit(onCreate)} className="flex flex-col gap-3">
          <Input placeholder="João Silva" {...createForm.register("name")} />
          <Input placeholder="joao@email.com" {...createForm.register("email")} />
          <Input type="password" placeholder="senha123" {...createForm.register("password")} />
          <Select {...createForm.register("role")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </Select>
          {(createForm.formState.errors.name ||
            createForm.formState.errors.email ||
            createForm.formState.errors.password) && (
            <p className="text-xs text-red-600">
              {createForm.formState.errors.name?.message ??
                createForm.formState.errors.email?.message ??
                createForm.formState.errors.password?.message}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </form>
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={`Editar usuário #${editing?.id}`}>
        <form onSubmit={editForm.handleSubmit(onEdit)} className="flex flex-col gap-3">
          <Input placeholder="Nome" {...editForm.register("name")} />
          <Input placeholder="Email" {...editForm.register("email")} />
          <Input type="password" placeholder="Nova senha (opcional)" {...editForm.register("password")} />
          <Select {...editForm.register("role")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </Select>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remover usuário"
        description="Tem certeza que deseja remover este usuário?"
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}
