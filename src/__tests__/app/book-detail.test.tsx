import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import BookDetailPage from "@/app/books/[id]/page";
import { useAuth } from "@/lib/auth-context";
import { useBook, useCopies } from "@/lib/hooks";
import { createReservation } from "@/lib/services";
import {
  bookDomCasmurro,
  copiesPage,
  copyAvailable,
  copyBorrowed,
  createAdminAuth,
  createUserAuth,
  errorQuery,
  loadingQuery,
  makePage,
  successfulQuery,
} from "@/test/fixtures";
import { fulfilled, renderWithProviders } from "@/test/render";

vi.mock("@/components/guards", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/hooks", () => ({
  useBook: vi.fn(),
  useCopies: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createReservation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseBook = vi.mocked(useBook);
const mockUseCopies = vi.mocked(useCopies);
const mockCreateReservation = vi.mocked(createReservation);
const mockToast = vi.mocked(toast);

function renderDetail(id = "1") {
  return renderWithProviders(
    <Suspense fallback={<p>Carregando parâmetros...</p>}>
      <BookDetailPage params={fulfilled({ id })} />
    </Suspense>
  );
}

describe("Tela de detalhe do livro", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createUserAuth());
    mockUseBook.mockReturnValue(
      successfulQuery(bookDomCasmurro) as never
    );
    mockUseCopies.mockReturnValue(successfulQuery(copiesPage) as never);
    mockCreateReservation.mockResolvedValue({
      id: 1,
      userId: 2,
      copyId: copyAvailable.id,
      status: "PENDING",
    });
  });

  it("exibe os dados do livro e suas cópias", async () => {
    renderDetail();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Dom Casmurro" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Machado de Assis • 1899 • Romance/)
    ).toBeInTheDocument();
    expect(screen.getByText("BC-001")).toBeInTheDocument();
    expect(screen.getByText("BC-002")).toBeInTheDocument();
    expect(screen.getByText("AVAILABLE")).toBeInTheDocument();
    expect(screen.getByText("BORROWED")).toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reservar" })
    ).toBeInTheDocument();
  });

  it("consulta as cópias do livro e apenas uma vez o livro", async () => {
    renderDetail("7");

    await screen.findByRole("heading", { level: 1, name: "Dom Casmurro" });

    expect(mockUseBook).toHaveBeenCalledWith("7");
    expect(mockUseCopies).toHaveBeenCalledWith({
      bookId: 7,
      page: 1,
      limit: 50,
    });
  });

  it("mostra estado de carregamento do livro", async () => {
    mockUseBook.mockReturnValue(loadingQuery() as never);

    const { container } = renderDetail();

    await waitFor(() =>
      expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
        0
      )
    );
  });

  it("mostra mensagem quando o livro não é encontrado", async () => {
    mockUseBook.mockReturnValue(errorQuery() as never);

    renderDetail();

    expect(await screen.findByText("Livro não encontrado.")).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há cópias", async () => {
    mockUseCopies.mockReturnValue(successfulQuery(makePage([])) as never);

    renderDetail();

    expect(
      await screen.findByText("Nenhuma cópia cadastrada para este livro.")
    ).toBeInTheDocument();
  });

  it("reserva uma cópia disponível", async () => {
    const { user, queryClient } = renderDetail();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await screen.findByRole("heading", { level: 1, name: "Dom Casmurro" });
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    await waitFor(() =>
      expect(mockCreateReservation).toHaveBeenCalledWith({
        copyId: copyAvailable.id,
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      "Cópia reservada por 24h! Veja em /reservations."
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["copies"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reservations"] });
  });

  it("exibe erro da API ao tentar reservar cópia indisponível", async () => {
    mockCreateReservation.mockRejectedValue({
      response: { data: { error: "Cópia não está disponível" } },
    });
    const { user } = renderDetail();

    await screen.findByRole("heading", { level: 1, name: "Dom Casmurro" });
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Cópia não está disponível")
    );
  });

  it("exibe link de edição apenas para administradores", async () => {
    mockUseAuth.mockReturnValue(createAdminAuth());

    renderDetail();

    expect(
      await screen.findByRole("link", { name: "Editar" })
    ).toHaveAttribute("href", "/books/1/edit");
  });

  it("não exibe link de edição para usuário comum", async () => {
    renderDetail();

    await screen.findByRole("heading", { level: 1, name: "Dom Casmurro" });

    expect(
      screen.queryByRole("link", { name: "Editar" })
    ).not.toBeInTheDocument();
  });

  it("não reserva cópias que não estão disponíveis", async () => {
    mockUseCopies.mockReturnValue(
      successfulQuery(makePage([copyBorrowed])) as never
    );
    const { user } = renderDetail();

    await screen.findByRole("heading", { level: 1, name: "Dom Casmurro" });

    expect(screen.queryByRole("button", { name: "Reservar" })).not.toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
    expect(mockCreateReservation).not.toHaveBeenCalled();
    expect(user).toBeDefined();
  });
});
