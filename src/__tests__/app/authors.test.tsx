import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import AuthorsPage from "@/app/authors/page";
import { useAuth } from "@/lib/auth-context";
import { useAuthors } from "@/lib/hooks";
import {
  createAuthor,
  deleteAuthor,
  updateAuthor,
} from "@/lib/services";
import {
  authorsPage,
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
  useAuthors: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createAuthor: vi.fn(),
  updateAuthor: vi.fn(),
  deleteAuthor: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseAuthors = vi.mocked(useAuthors);
const mockCreateAuthor = vi.mocked(createAuthor);
const mockUpdateAuthor = vi.mocked(updateAuthor);
const mockDeleteAuthor = vi.mocked(deleteAuthor);
const mockToast = vi.mocked(toast);

describe("Tela de Autores", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createUserAuth());
    mockUseAuthors.mockReturnValue(successfulQuery(authorsPage) as never);
    mockCreateAuthor.mockResolvedValue({ id: 3, name: "José de Alencar" });
    mockUpdateAuthor.mockResolvedValue({ id: 1, name: "Machado de Assis" });
    mockDeleteAuthor.mockResolvedValue(undefined);
  });

  it("lista autores em tabela", () => {
    renderWithProviders(<AuthorsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Autores" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "ID" })
    ).toBeInTheDocument();
    expect(screen.getByText("Machado de Assis")).toBeInTheDocument();
    expect(screen.getByText("Clarice Lispector")).toBeInTheDocument();
  });

  it("exibe skeleton durante o carregamento", () => {
    mockUseAuthors.mockReturnValue(loadingQuery() as never);

    const { container } = renderWithProviders(<AuthorsPage />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
    expect(screen.queryByText("Nenhum autor encontrado.")).not.toBeInTheDocument();
  });

  it("exibe estado vazio", () => {
    mockUseAuthors.mockReturnValue(successfulQuery(makePage([])) as never);

    renderWithProviders(<AuthorsPage />);

    expect(screen.getByText("Nenhum autor encontrado.")).toBeInTheDocument();
  });

  it("não exibe ações de escrita para usuário comum", () => {
    renderWithProviders(<AuthorsPage />);

    expect(
      screen.queryByRole("button", { name: "+ Novo Autor" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Ações" })
    ).not.toBeInTheDocument();
  });

  it("cria um autor a partir do modal", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user, queryClient } = renderWithProviders(<AuthorsPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "+ Novo Autor" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Novo autor" })
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();

    await user.type(
      within(dialog).getByPlaceholderText("Clarice Lispector"),
      "José de Alencar"
    );
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockCreateAuthor).toHaveBeenCalledWith({ name: "José de Alencar" })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Autor criado");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["authors"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edita um autor existente", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<AuthorsPage />);

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Editar autor" })
    ).toBeInTheDocument();
    const input = within(dialog).getByPlaceholderText("Clarice Lispector");
    expect(input).toHaveValue("Machado de Assis");

    await user.clear(input);
    await user.type(input, "Machado de Assis Jr.");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockUpdateAuthor).toHaveBeenCalledWith(1, {
        name: "Machado de Assis Jr.",
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Autor atualizado");
  });

  it("remove um autor após confirmação", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<AuthorsPage />);

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[1]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Remover autor" })
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(mockDeleteAuthor).toHaveBeenCalledWith(2));
    expect(mockToast.success).toHaveBeenCalledWith("Autor removido");
  });

  it("exibe erro da API ao falhar a remoção", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    mockDeleteAuthor.mockRejectedValue({
      response: { data: { error: "Autor possui livros vinculados" } },
    });
    const { user } = renderWithProviders(<AuthorsPage />);

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Excluir",
      })
    );

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        "Autor possui livros vinculados"
      )
    );
  });

  it("navega entre páginas", async () => {
    mockUseAuthors.mockReturnValue(
      successfulQuery(makePage(authorsPage.data, { totalPages: 2 })) as never
    );
    const { user } = renderWithProviders(<AuthorsPage />);

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(mockUseAuthors).toHaveBeenCalledWith(2, 10));
  });
});
