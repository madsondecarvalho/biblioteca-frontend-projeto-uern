import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import CopiesPage from "@/app/copies/page";
import { useAuth } from "@/lib/auth-context";
import { useBooks, useCopies } from "@/lib/hooks";
import {
  createCopy,
  createReservation,
  deleteCopy,
  updateCopy,
} from "@/lib/services";
import {
  booksPage,
  copyAvailable,
  copiesPage,
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
  useCopies: vi.fn(),
  useBooks: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createCopy: vi.fn(),
  updateCopy: vi.fn(),
  deleteCopy: vi.fn(),
  createReservation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseCopies = vi.mocked(useCopies);
const mockUseBooks = vi.mocked(useBooks);
const mockCreateCopy = vi.mocked(createCopy);
const mockUpdateCopy = vi.mocked(updateCopy);
const mockDeleteCopy = vi.mocked(deleteCopy);
const mockCreateReservation = vi.mocked(createReservation);
const mockToast = vi.mocked(toast);

describe("Tela de Cópias", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createUserAuth());
    mockUseCopies.mockReturnValue(successfulQuery(copiesPage) as never);
    mockUseBooks.mockReturnValue(successfulQuery(booksPage) as never);
    mockCreateCopy.mockResolvedValue({ ...copyAvailable, id: 13, code: "BC-010" });
    mockUpdateCopy.mockResolvedValue(copyAvailable);
    mockDeleteCopy.mockResolvedValue(undefined);
    mockCreateReservation.mockResolvedValue({
      id: 1,
      userId: 2,
      copyId: copyAvailable.id,
      status: "PENDING",
    });
  });

  it("lista as cópias com livro, código e status", () => {
    renderWithProviders(<CopiesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Cópias" })
    ).toBeInTheDocument();
    expect(screen.getByText("BC-001")).toBeInTheDocument();
    expect(screen.getByText("BC-002")).toBeInTheDocument();
    expect(screen.getAllByText("Dom Casmurro")).toHaveLength(2);
    expect(screen.getAllByText("AVAILABLE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BORROWED").length).toBeGreaterThan(0);
  });

  it("exibe skeleton durante o carregamento", () => {
    mockUseCopies.mockReturnValue(loadingQuery() as never);

    const { container } = renderWithProviders(<CopiesPage />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });

  it("exibe estado vazio", () => {
    mockUseCopies.mockReturnValue(successfulQuery(makePage([])) as never);

    renderWithProviders(<CopiesPage />);

    expect(screen.getByText("Nenhuma cópia encontrada.")).toBeInTheDocument();
  });

  it("não exibe ações administrativas para usuário comum", () => {
    renderWithProviders(<CopiesPage />);

    expect(
      screen.queryByRole("button", { name: "+ Nova Cópia" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reservar" })).toBeInTheDocument();
  });

  it("aplica filtros de livro e status", async () => {
    const { user } = renderWithProviders(<CopiesPage />);

    await user.selectOptions(screen.getAllByRole("combobox")[0], "1");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "BORROWED");

    await waitFor(() =>
      expect(mockUseCopies).toHaveBeenLastCalledWith(
        expect.objectContaining({ bookId: 1, status: "BORROWED", page: 1 })
      )
    );
  });

  it("limpa os filtros", async () => {
    const { user } = renderWithProviders(<CopiesPage />);

    await user.selectOptions(screen.getAllByRole("combobox")[0], "1");
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

    await waitFor(() =>
      expect(mockUseCopies).toHaveBeenLastCalledWith(
        expect.objectContaining({
          bookId: undefined,
          status: undefined,
          page: 1,
        })
      )
    );
  });

  it("cria uma cópia pelo modal administrativo", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user, queryClient } = renderWithProviders(<CopiesPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "+ Nova Cópia" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova cópia" })
    ).toBeInTheDocument();

    await user.type(within(dialog).getByRole("textbox"), "BC-010");
    await user.selectOptions(
      within(dialog).getAllByRole("combobox")[0],
      "1"
    );
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockCreateCopy).toHaveBeenCalledWith({
        code: "BC-010",
        bookId: 1,
        status: "AVAILABLE",
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Cópia criada");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["copies"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não cria cópia quando os campos obrigatórios estão vazios", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<CopiesPage />);

    await user.click(screen.getByRole("button", { name: "+ Nova Cópia" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Salvar" })
    );

    await waitFor(() => expect(mockCreateCopy).not.toHaveBeenCalled());
  });

  it("edita uma cópia existente", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<CopiesPage />);

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Editar cópia" })
    ).toBeInTheDocument();
    const codeInput = within(dialog).getByDisplayValue("BC-001");

    await user.clear(codeInput);
    await user.type(codeInput, "BC-100");
    await user.selectOptions(
      within(dialog).getAllByRole("combobox")[1],
      "MAINTENANCE"
    );
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockUpdateCopy).toHaveBeenCalledWith(11, {
        code: "BC-100",
        bookId: 1,
        status: "MAINTENANCE",
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Cópia atualizada");
  });

  it("remove uma cópia após confirmação", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<CopiesPage />);

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Excluir",
      })
    );

    await waitFor(() => expect(mockDeleteCopy).toHaveBeenCalledWith(11));
    expect(mockToast.success).toHaveBeenCalledWith("Cópia removida");
  });

  it("reserva uma cópia disponível diretamente na listagem", async () => {
    const { user, queryClient } = renderWithProviders(<CopiesPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "Reservar" }));

    await waitFor(() =>
      expect(mockCreateReservation).toHaveBeenCalledWith({ copyId: 11 })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Cópia reservada por 24h!");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["copies"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reservations"] });
  });

  it("exibe erro ao falhar a reserva", async () => {
    mockCreateReservation.mockRejectedValue({
      response: { data: { error: "Cópia já reservada" } },
    });
    const { user } = renderWithProviders(<CopiesPage />);

    await user.click(screen.getByRole("button", { name: "Reservar" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Cópia já reservada")
    );
  });

  it("navega para a próxima página", async () => {
    mockUseCopies.mockReturnValue(
      successfulQuery(makePage(copiesPage.data, { totalPages: 2 })) as never
    );
    const { user } = renderWithProviders(<CopiesPage />);

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() =>
      expect(mockUseCopies).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      )
    );
  });
});
