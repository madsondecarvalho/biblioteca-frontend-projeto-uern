import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import BooksPage from "@/app/books/page";
import { useAuth } from "@/lib/auth-context";
import { useAllAuthors, useAllCategories, useBooks } from "@/lib/hooks";
import { deleteBook } from "@/lib/services";
import {
  authorsPage,
  booksPage,
  categoriesPage,
  createAdminAuth,
  createUserAuth,
  errorQuery,
  loadingQuery,
  makePage,
  successfulQuery,
} from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

vi.mock("@/components/guards", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/hooks", () => ({
  useBooks: vi.fn(),
  useAllAuthors: vi.fn(),
  useAllCategories: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  deleteBook: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseBooks = vi.mocked(useBooks);
const mockUseAllAuthors = vi.mocked(useAllAuthors);
const mockUseAllCategories = vi.mocked(useAllCategories);
const mockDeleteBook = vi.mocked(deleteBook);
const mockToast = vi.mocked(toast);

function renderBooks() {
  return renderWithProviders(<BooksPage />);
}

describe("Tela de Livros", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createUserAuth());
    mockUseBooks.mockReturnValue(successfulQuery(booksPage) as never);
    mockUseAllAuthors.mockReturnValue(successfulQuery(authorsPage) as never);
    mockUseAllCategories.mockReturnValue(
      successfulQuery(categoriesPage) as never
    );
    mockDeleteBook.mockResolvedValue(undefined);
  });

  it("lista os livros com autor, ano e categoria", () => {
    renderBooks();

    expect(
      screen.getByRole("heading", { level: 1, name: "Livros" })
    ).toBeInTheDocument();
    expect(screen.getByText("Dom Casmurro")).toBeInTheDocument();
    expect(
      screen.getByText(/Machado de Assis • 1899/)
    ).toBeInTheDocument();
    expect(screen.getAllByText("Romance").length).toBeGreaterThan(0);
    expect(screen.getByText("A Hora da Estrela")).toBeInTheDocument();
    expect(screen.getByText("Sem categoria")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Ver \/ Reservar/ })
    ).toHaveLength(2);
  });

  it("preenche os filtros com autores e categorias", () => {
    renderBooks();

    expect(screen.getByRole("option", { name: "Romance" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Drama" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Machado de Assis" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Clarice Lispector" })
    ).toBeInTheDocument();
  });

  it("filtra a lista pelo título ou autor", async () => {
    const { user } = renderBooks();

    await user.type(
      screen.getByPlaceholderText("Buscar por título ou autor..."),
      "clarice"
    );

    expect(screen.getByText("A Hora da Estrela")).toBeInTheDocument();
    expect(screen.queryByText("Dom Casmurro")).not.toBeInTheDocument();
  });

  it("envia os filtros de categoria, autor e página", async () => {
    mockUseBooks.mockReturnValue(
      successfulQuery(
        makePage(booksPage.data, { page: 1, totalPages: 3, total: 25 })
      ) as never
    );
    const { user } = renderBooks();

    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      screen.getByRole("option", { name: "Romance" })
    );
    await user.selectOptions(
      screen.getAllByRole("combobox")[1],
      screen.getByRole("option", { name: "Clarice Lispector" })
    );

    await waitFor(() =>
      expect(mockUseBooks).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: 1, authorId: 2, page: 1 })
      )
    );
  });

  it("limpa os filtros aplicados", async () => {
    const { user } = renderBooks();

    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      screen.getByRole("option", { name: "Romance" })
    );
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(screen.getAllByRole("combobox")[0]).toHaveValue("");
    await waitFor(() =>
      expect(mockUseBooks).toHaveBeenLastCalledWith(
        expect.objectContaining({
          categoryId: undefined,
          authorId: undefined,
          page: 1,
        })
      )
    );
  });

  it("navega para a próxima página", async () => {
    mockUseBooks.mockReturnValue(
      successfulQuery(
        makePage(booksPage.data, { page: 1, totalPages: 3, total: 25 })
      ) as never
    );
    const { user } = renderBooks();

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() =>
      expect(mockUseBooks).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      )
    );
  });

  it("exibe estado vazio quando não há livros", () => {
    mockUseBooks.mockReturnValue(successfulQuery(makePage([])) as never);

    renderBooks();

    expect(screen.getByText("Nenhum livro encontrado.")).toBeInTheDocument();
  });

  it("exibe erro de carregamento", () => {
    mockUseBooks.mockReturnValue(errorQuery() as never);

    renderBooks();

    expect(screen.getByText("Erro ao carregar livros.")).toBeInTheDocument();
  });

  it("exibe skeleton durante o carregamento", () => {
    mockUseBooks.mockReturnValue(loadingQuery() as never);

    const { container } = renderBooks();

    expect(
      container.querySelectorAll(".animate-pulse").length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Nenhum livro encontrado.")).not.toBeInTheDocument();
  });

  it("não exibe ações administrativas para usuário comum", () => {
    renderBooks();

    expect(
      screen.queryByRole("link", { name: "+ Novo Livro" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir" })
    ).not.toBeInTheDocument();
  });

  it("exibe ações administrativas para admin", () => {
    mockUseAuth.mockReturnValue(createAdminAuth());

    renderBooks();

    expect(
      screen.getByRole("link", { name: "+ Novo Livro" })
    ).toHaveAttribute("href", "/books/new");
    expect(
      screen.getAllByRole("link", { name: "Editar" })[0]
    ).toHaveAttribute("href", "/books/1/edit");
    expect(
      screen.getAllByRole("button", { name: "Excluir" })
    ).toHaveLength(2);
  });

  it("remove um livro confirmando o diálogo", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user, queryClient } = renderBooks();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    expect(
      screen.getByRole("heading", { name: "Remover livro" })
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Excluir",
      })
    );

    await waitFor(() => expect(mockDeleteBook).toHaveBeenCalledWith(1));
    expect(mockToast.success).toHaveBeenCalledWith("Livro removido");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["books"] });
  });

  it("exibe erro da API ao falhar a remoção", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    mockDeleteBook.mockRejectedValue({
      response: { data: { error: "Livro possui cópias vinculadas" } },
    });
    const { user } = renderBooks();

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Excluir",
      })
    );

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        "Livro possui cópias vinculadas"
      )
    );
  });
});
