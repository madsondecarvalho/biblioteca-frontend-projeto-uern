import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import CategoriesPage from "@/app/categories/page";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/lib/hooks";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/services";
import {
  categoriesPage,
  createAdminAuth,
  createUserAuth,
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
  useCategories: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseCategories = vi.mocked(useCategories);
const mockCreateCategory = vi.mocked(createCategory);
const mockUpdateCategory = vi.mocked(updateCategory);
const mockDeleteCategory = vi.mocked(deleteCategory);
const mockToast = vi.mocked(toast);

describe("Tela de Categorias", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createUserAuth());
    mockUseCategories.mockReturnValue(
      successfulQuery(categoriesPage) as never
    );
    mockCreateCategory.mockResolvedValue({ id: 3, name: "Policial" });
    mockUpdateCategory.mockResolvedValue({ id: 1, name: "Romance" });
    mockDeleteCategory.mockResolvedValue(undefined);
  });

  it("lista as categorias em tabela", () => {
    renderWithProviders(<CategoriesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Categorias" })
    ).toBeInTheDocument();
    expect(screen.getByText("Romance")).toBeInTheDocument();
    expect(screen.getByText("Drama")).toBeInTheDocument();
  });

  it("exibe skeleton durante o carregamento", () => {
    mockUseCategories.mockReturnValue(loadingQuery() as never);

    const { container } = renderWithProviders(<CategoriesPage />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });

  it("exibe estado vazio", () => {
    mockUseCategories.mockReturnValue(
      successfulQuery(makePage([])) as never
    );

    renderWithProviders(<CategoriesPage />);

    expect(
      screen.getByText("Nenhuma categoria encontrada.")
    ).toBeInTheDocument();
  });

  it("não exibe ações de escrita para usuário comum", () => {
    renderWithProviders(<CategoriesPage />);

    expect(
      screen.queryByRole("button", { name: "+ Nova Categoria" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir" })
    ).not.toBeInTheDocument();
  });

  it("cria uma categoria a partir do modal", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user, queryClient } = renderWithProviders(<CategoriesPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "+ Nova Categoria" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova categoria" })
    ).toBeInTheDocument();

    await user.type(within(dialog).getByPlaceholderText("Policial"), "Policial");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockCreateCategory).toHaveBeenCalledWith({ name: "Policial" })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Categoria criada");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("valida nome obrigatório no modal", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<CategoriesPage />);

    await user.click(screen.getByRole("button", { name: "+ Nova Categoria" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Salvar" })
    );

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
    expect(mockCreateCategory).not.toHaveBeenCalled();
  });

  it("edita uma categoria existente", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<CategoriesPage />);

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Editar categoria" })
    ).toBeInTheDocument();
    const input = within(dialog).getByPlaceholderText("Policial");
    expect(input).toHaveValue("Romance");

    await user.clear(input);
    await user.type(input, "Romance Histórico");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockUpdateCategory).toHaveBeenCalledWith(1, {
        name: "Romance Histórico",
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Categoria atualizada");
  });

  it("remove uma categoria após confirmação", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<CategoriesPage />);

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[1]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Remover categoria" })
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(mockDeleteCategory).toHaveBeenCalledWith(2));
    expect(mockToast.success).toHaveBeenCalledWith("Categoria removida");
  });

  it("exibe erro da API ao falhar a remoção", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    mockDeleteCategory.mockRejectedValue({
      response: { data: { error: "Categoria possui livros vinculados" } },
    });
    const { user } = renderWithProviders(<CategoriesPage />);

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Excluir",
      })
    );

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        "Categoria possui livros vinculados"
      )
    );
  });

  it("navega para a próxima página", async () => {
    mockUseCategories.mockReturnValue(
      successfulQuery(
        makePage(categoriesPage.data, { totalPages: 2 })
      ) as never
    );
    const { user } = renderWithProviders(<CategoriesPage />);

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(mockUseCategories).toHaveBeenCalledWith(2, 10));
  });
});
