import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import NewBookPage from "@/app/books/new/page";
import { useAllAuthors, useAllCategories } from "@/lib/hooks";
import { createBook } from "@/lib/services";
import {
  authorsPage,
  bookDomCasmurro,
  categoriesPage,
  successfulQuery,
} from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/guards", () => ({
  AdminGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/hooks", () => ({
  useAllAuthors: vi.fn(),
  useAllCategories: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createBook: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAllAuthors = vi.mocked(useAllAuthors);
const mockUseAllCategories = vi.mocked(useAllCategories);
const mockCreateBook = vi.mocked(createBook);
const mockToast = vi.mocked(toast);

describe("Tela de novo livro", () => {
  beforeEach(() => {
    mockUseAllAuthors.mockReturnValue(successfulQuery(authorsPage) as never);
    mockUseAllCategories.mockReturnValue(
      successfulQuery(categoriesPage) as never
    );
    mockCreateBook.mockResolvedValue(bookDomCasmurro);
  });

  it("renderiza o formulário e as opções de autor/categoria", () => {
    renderWithProviders(<NewBookPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Novo livro" })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Dom Casmurro")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Machado de Assis" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Romance" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sem categoria" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar livro" })).toBeInTheDocument();
  });

  it("valida título e autor obrigatórios", async () => {
    const { user } = renderWithProviders(<NewBookPage />);

    await user.click(screen.getByRole("button", { name: "Criar livro" }));

    expect(await screen.findByText("Título é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Autor é obrigatório")).toBeInTheDocument();
    expect(mockCreateBook).not.toHaveBeenCalled();
  });

  it("cria o livro e navega para o detalhe", async () => {
    const { user } = renderWithProviders(<NewBookPage />);

    await user.type(screen.getByPlaceholderText("Dom Casmurro"), "Dom Casmurro");
    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      screen.getByRole("option", { name: "Machado de Assis" })
    );
    await user.selectOptions(
      screen.getAllByRole("combobox")[1],
      screen.getByRole("option", { name: "Romance" })
    );
    await user.click(screen.getByRole("button", { name: "Criar livro" }));

    await waitFor(() =>
      expect(mockCreateBook).toHaveBeenCalledWith({
        title: "Dom Casmurro",
        authorId: 1,
        year: new Date().getFullYear(),
        categoryId: 1,
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Livro criado");
    expect(push).toHaveBeenCalledWith("/books/1");
  });

  it("envia categoria nula quando nenhuma é selecionada", async () => {
    const { user } = renderWithProviders(<NewBookPage />);

    await user.type(screen.getByPlaceholderText("Dom Casmurro"), "Dom Casmurro");
    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      screen.getByRole("option", { name: "Machado de Assis" })
    );
    await user.click(screen.getByRole("button", { name: "Criar livro" }));

    await waitFor(() =>
      expect(mockCreateBook).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: null })
      )
    );
  });

  it("exibe erro da API ao falhar a criação", async () => {
    mockCreateBook.mockRejectedValue({
      response: { data: { error: "Ano inválido" } },
    });
    const { user } = renderWithProviders(<NewBookPage />);

    await user.type(screen.getByPlaceholderText("Dom Casmurro"), "Dom Casmurro");
    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      screen.getByRole("option", { name: "Machado de Assis" })
    );
    await user.click(screen.getByRole("button", { name: "Criar livro" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Ano inválido")
    );
    expect(push).not.toHaveBeenCalled();
  });
});
