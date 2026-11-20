import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import ReservationsPage from "@/app/reservations/page";
import { useAuth } from "@/lib/auth-context";
import { useReservations } from "@/lib/hooks";
import {
  deleteReservation,
  updateReservationStatus,
} from "@/lib/services";
import {
  createAdminAuth,
  createUserAuth,
  loadingQuery,
  makePage,
  reservationsPage,
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
  useReservations: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  updateReservationStatus: vi.fn(),
  deleteReservation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseReservations = vi.mocked(useReservations);
const mockUpdateStatus = vi.mocked(updateReservationStatus);
const mockDeleteReservation = vi.mocked(deleteReservation);
const mockToast = vi.mocked(toast);

describe("Tela de Reservas", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createUserAuth());
    mockUseReservations.mockReturnValue(
      successfulQuery(reservationsPage) as never
    );
    mockUpdateStatus.mockResolvedValue({
      id: 101,
      userId: 2,
      copyId: 11,
      status: "PICKED_UP",
    });
    mockDeleteReservation.mockResolvedValue(undefined);
  });

  it("lista reservas com cópia, status e datas", () => {
    renderWithProviders(<ReservationsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Reservas" })
    ).toBeInTheDocument();
    expect(screen.getByText("BC-001")).toBeInTheDocument();
    expect(screen.getByText("BC-002")).toBeInTheDocument();
    expect(screen.getAllByText("PENDING").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PICKED_UP").length).toBeGreaterThan(0);
  });

  it("exibe skeleton durante o carregamento", () => {
    mockUseReservations.mockReturnValue(loadingQuery() as never);

    const { container } = renderWithProviders(<ReservationsPage />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });

  it("exibe estado vazio", () => {
    mockUseReservations.mockReturnValue(
      successfulQuery(makePage([])) as never
    );

    renderWithProviders(<ReservationsPage />);

    expect(screen.getByText("Nenhuma reserva encontrada.")).toBeInTheDocument();
  });

  it("mostra a visão do usuário comum sem ações administrativas", () => {
    renderWithProviders(<ReservationsPage />);

    expect(
      screen.getByText(/Você vê apenas as suas reservas/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Usuário" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirmar retirada" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("maria@uern.br")).not.toBeInTheDocument();
  });

  it("mostra dados do usuário e ações para administradores", () => {
    mockUseAuth.mockReturnValue(createAdminAuth());

    renderWithProviders(<ReservationsPage />);

    expect(
      screen.getByText(/Admin vê todas/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Usuário" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Maria Leitora (maria@uern.br)")).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Confirmar retirada" })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Cancelar" })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Expirar" })
    ).toHaveLength(2);
  });

  it("desabilita transições para reservas que não estão pendentes", () => {
    mockUseAuth.mockReturnValue(createAdminAuth());

    renderWithProviders(<ReservationsPage />);

    const confirmButtons = screen.getAllByRole("button", {
      name: "Confirmar retirada",
    });
    expect(confirmButtons[0]).toBeEnabled();
    expect(confirmButtons[1]).toBeDisabled();
  });

  it("filtra por status", async () => {
    const { user } = renderWithProviders(<ReservationsPage />);

    await user.selectOptions(screen.getByRole("combobox"), "PENDING");

    await waitFor(() =>
      expect(mockUseReservations).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        status: "PENDING",
      })
    );

    await user.click(screen.getByRole("button", { name: "Limpar filtro" }));

    await waitFor(() =>
      expect(mockUseReservations).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        status: undefined,
      })
    );
  });

  it("confirma a retirada de uma reserva pendente", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user, queryClient } = renderWithProviders(<ReservationsPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(
      screen.getAllByRole("button", { name: "Confirmar retirada" })[0]
    );

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith(101, "PICKED_UP")
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      "Reserva confirmada (retirada)"
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reservations"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["copies"] });
  });

  it("cancela uma reserva pendente", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<ReservationsPage />);

    await user.click(screen.getAllByRole("button", { name: "Cancelar" })[0]);

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith(101, "CANCELLED")
    );
    expect(mockToast.success).toHaveBeenCalledWith("Reserva cancelada");
  });

  it("marca uma reserva como expirada", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<ReservationsPage />);

    await user.click(screen.getAllByRole("button", { name: "Expirar" })[0]);

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith(101, "EXPIRED")
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      "Reserva marcada como expirada"
    );
  });

  it("exibe erro da API ao falhar a transição de status", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    mockUpdateStatus.mockRejectedValue({
      response: { data: { error: "Reserva já expirada" } },
    });
    const { user } = renderWithProviders(<ReservationsPage />);

    await user.click(
      screen.getAllByRole("button", { name: "Confirmar retirada" })[0]
    );

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Reserva já expirada")
    );
  });

  it("remove uma reserva após confirmação", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    const { user } = renderWithProviders(<ReservationsPage />);

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Remover reserva" })
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(mockDeleteReservation).toHaveBeenCalledWith(101)
    );
    expect(mockToast.success).toHaveBeenCalledWith("Reserva removida");
  });

  it("navega para a próxima página", async () => {
    mockUseReservations.mockReturnValue(
      successfulQuery(
        makePage(reservationsPage.data, { totalPages: 2 })
      ) as never
    );
    const { user } = renderWithProviders(<ReservationsPage />);

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() =>
      expect(mockUseReservations).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      )
    );
  });
});
