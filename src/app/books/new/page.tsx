"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AdminGuard } from "@/components/guards";
import { useAllAuthors, useAllCategories } from "@/lib/hooks";
import { createBook } from "@/lib/services";
import { bookSchema, type BookForm } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

function NewBookContent() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const authors = useAllAuthors();
  const categories = useAllCategories();

  const form = useForm<BookForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookSchema) as any,
    defaultValues: { title: "", authorId: 0, year: new Date().getFullYear() },
  });

  async function onSubmit(values: BookForm) {
    setSaving(true);
    try {
      const created = await createBook({
        title: values.title,
        authorId: Number(values.authorId),
        year: Number(values.year),
        categoryId: values.categoryId ? Number(values.categoryId) : null,
      });
      toast.success("Livro criado");
      router.push(`/books/${created.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao criar livro"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Novo livro</h1>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Título *</label>
            <Input placeholder="Dom Casmurro" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Autor *</label>
            <Select {...form.register("authorId")}>
              <option value={0}>Selecione...</option>
              {authors.data?.data.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            {form.formState.errors.authorId && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.authorId.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ano *</label>
            <Input type="number" {...form.register("year")} />
            {form.formState.errors.year && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.year.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Categoria (opcional)</label>
            <Select
              {...form.register("categoryId", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            >
              <option value="">Sem categoria</option>
              {categories.data?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Criar livro"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function NewBookPage() {
  return (
    <AdminGuard>
      <NewBookContent />
    </AdminGuard>
  );
}
