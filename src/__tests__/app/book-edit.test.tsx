import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import EditBookPage from "@/app/books/[id]/edit/page";
import { useAllAuthors, useAllCategories, useBook } from "@/lib/hooks";
import { updateBook } from "@/lib/services";
import {
  authorsPage,
  bookDomCasmurro,
  categoriesPage,
  errorQuery,
  loadingQuery,
  successfulQuery,
} from "@/test/fixtures";
import { fulfilled, renderWithProviders } from "@/test/render";

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
  useBook: vi.fn(),
  useAllAuthors: vi.fn(),
  useAllCategories: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  updateBook: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseBook = vi.mocked(useBook);
const mockUseAllAuthors = vi.mocked(useAllAuthors);
const mockUseAllCategories = vi.mocked(useAllCategories);
const mockUpdateBook = vi.mocked(updateBook);
const mockToast = vi.mocked(toast);

function renderEdit(id = "1") {
  return renderWithProviders(
    <Suspense fallback={<p>Carregando parâmetros...</p>}>
      <EditBookPage params={fulfilled({ id })} />
    </Suspense>
  );
}

describe("Tela de edição de livro", () => {
  beforeEach(() => {
    mockUseBook.mockReturnValue(successfulQuery(bookDomCasmurro) as never);
    mockUseAllAuthors.mockReturnValue(successfulQuery(authorsPage) as never);
    mockUseAllCategories.mockReturnValue(
      successfulQuery(categoriesPage) as never
    );
    mockUpdateBook.mockResolvedValue(bookDomCasmurro);
  });

  it("carrega o formulário com os dados do livro", async () => {
    renderEdit();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Editar livro #1",
      })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByDisplayValue("Dom Casmurro")).toBeInTheDocument()
    );
    const combos = screen.getAllByRole("combobox");
    expect(combos[0]).toHaveValue("1");
    expect(combos[1]).toHaveValue("1");
  });

  it("exibe skeleton enquanto o livro carrega", async () => {
    mockUseBook.mockReturnValue(loadingQuery() as never);

    const { container } = renderEdit();

    await waitFor(() =>
      expect(
        container.querySelectorAll(".animate-pulse").length
      ).toBeGreaterThan(0)
    );
  });

  it("exibe mensagem quando o livro não é encontrado", async () => {
    mockUseBook.mockReturnValue(errorQuery() as never);

    renderEdit();

    expect(await screen.findByText("Livro não encontrado.")).toBeInTheDocument();
  });

  it("salva as alterações e volta para o detalhe", async () => {
    const { user } = renderEdit();

    const titleInput = await screen.findByDisplayValue("Dom Casmurro");
    await user.clear(titleInput);
    await user.type(titleInput, "Dom Casmurro (edição revisada)");
    await user.selectOptions(
      screen.getAllByRole("combobox")[1],
      screen.getByRole("option", { name: "Drama" })
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockUpdateBook).toHaveBeenCalledWith("1", {
        title: "Dom Casmurro (edição revisada)",
        authorId: 1,
        year: 1899,
        categoryId: 2,
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Livro atualizado");
    expect(push).toHaveBeenCalledWith("/books/1");
  });

  it("exibe erro da API ao falhar a atualização", async () => {
    mockUpdateBook.mockRejectedValue({
      response: { data: { error: "Autor não encontrado" } },
    });
    const { user } = renderEdit();

    await screen.findByDisplayValue("Dom Casmurro");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Autor não encontrado")
    );
    expect(push).not.toHaveBeenCalled();
  });
});
