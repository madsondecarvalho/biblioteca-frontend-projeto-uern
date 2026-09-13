"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AdminGuard } from "@/components/guards";
import { useAllAuthors, useAllCategories, useBook } from "@/lib/hooks";
import { updateBook } from "@/lib/services";
import { bookSchema, type BookForm } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function EditContent({ id }: { id: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const book = useBook(id);
  const authors = useAllAuthors();
  const categories = useAllCategories();

  const form = useForm<BookForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookSchema) as any });

  useEffect(() => {
    if (book.data) {
      form.reset({
        title: book.data.title,
        authorId: book.data.authorId,
        year: book.data.year,
        categoryId: book.data.categoryId ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.data]);

  async function onSubmit(values: BookForm) {
    setSaving(true);
    try {
      await updateBook(id, {
        title: values.title,
        authorId: Number(values.authorId),
        year: Number(values.year),
        categoryId: values.categoryId ? Number(values.categoryId) : null,
      });
      toast.success("Livro atualizado");
      router.push(`/books/${id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao atualizar livro"));
    } finally {
      setSaving(false);
    }
  }

  if (book.isLoading) return <Skeleton className="h-64" />;
  if (book.isError || !book.data)
    return <p className="text-sm text-red-600">Livro não encontrado.</p>;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Editar livro #{id}</h1>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Título *</label>
            <Input {...form.register("title")} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Autor *</label>
            <Select {...form.register("authorId")}>
              {authors.data?.data.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ano *</label>
            <Input type="number" {...form.register("year")} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Categoria</label>
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
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminGuard>
      <EditContent id={id} />
    </AdminGuard>
  );
}
