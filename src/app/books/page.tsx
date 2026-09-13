"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards";
import { useAuth } from "@/lib/auth-context";
import { useAllAuthors, useAllCategories, useBooks } from "@/lib/hooks";
import { deleteBook } from "@/lib/services";
import { getApiErrorMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Pagination } from "@/components/pagination";

function BooksContent() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [authorId, setAuthorId] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filters = useMemo(
    () => ({
      page,
      limit,
      categoryId: categoryId ? Number(categoryId) : undefined,
      authorId: authorId ? Number(authorId) : undefined,
    }),
    [page, limit, categoryId, authorId]
  );

  const { data, isLoading, isError } = useBooks(filters);
  const categories = useAllCategories();
  const authors = useAllAuthors();

  const visible = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(s) ||
        b.Author?.name.toLowerCase().includes(s)
    );
  }, [data, search]);

  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteBook(deletingId);
      toast.success("Livro removido");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover livro"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Livros</h1>
          <p className="text-sm text-zinc-500">
            Catálogo com filtros por categoria e autor (?categoryId & authorId, ?page & limit)
          </p>
        </div>
        {isAdmin && (
          <Link href="/books/new">
            <Button>+ Novo Livro</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <Input
          placeholder="Buscar por título ou autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas as categorias</option>
          {categories.data?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={authorId}
          onChange={(e) => {
            setAuthorId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os autores</option>
          {authors.data?.data.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearch("");
            setCategoryId("");
            setAuthorId("");
            setPage(1);
          }}
        >
          Limpar filtros
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton /><Skeleton /><Skeleton />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">Erro ao carregar livros.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum livro encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((book) => (
            <Card key={book.id} className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{book.title}</h2>
              <p className="text-sm text-zinc-500">
                {book.Author?.name ?? `Autor #${book.authorId}`} • {book.year}
              </p>
              <div>
                {book.Category ? (
                  <Badge status="PICKED_UP">{book.Category.name}</Badge>
                ) : (
                  <span className="text-xs text-zinc-400">Sem categoria</span>
                )}
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Link href={`/books/${book.id}`}>
                  <Button size="sm">Ver / Reservar</Button>
                </Link>
                {isAdmin && (
                  <>
                    <Link href={`/books/${book.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingId(book.id)}
                    >
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination pagination={data?.pagination} onChange={setPage} />

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remover livro"
        description="Tem certeza que deseja remover este livro? Esta ação não pode ser desfeita."
      />
    </div>
  );
}

export default function BooksPage() {
  return (
    <RequireAuth>
      <BooksContent />
    </RequireAuth>
  );
}
