import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import Dashboard from "@/app/page";
import { useAuth } from "@/lib/auth-context";
import {
  useBooks,
  useCopies,
  useReservations,
  useUsers,
} from "@/lib/hooks";
import {
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
  useBooks: vi.fn(),
  useCopies: vi.fn(),
  useReservations: vi.fn(),
  useUsers: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseBooks = vi.mocked(useBooks);
const mockUseCopies = vi.mocked(useCopies);
const mockUseReservations = vi.mocked(useReservations);
const mockUseUsers = vi.mocked(useUsers);

function mockTotals({
  books = 12,
  copies = 5,
  reservations = 2,
  users = 8,
}: {
  books?: number;
  copies?: number;
  reservations?: number;
  users?: number;
} = {}) {
  mockUseBooks.mockReturnValue(
    successfulQuery(makePage([], { total: books })) as never
  );
  mockUseCopies.mockReturnValue(
    successfulQuery(makePage([], { total: copies })) as never
  );
  mockUseReservations.mockReturnValue(
    successfulQuery(makePage([], { total: reservations })) as never
  );
  mockUseUsers.mockReturnValue(
    successfulQuery(makePage([], { total: users })) as never
  );
}

describe("Tela de Dashboard", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createUserAuth());
    mockTotals();
  });

  it("mostra o título e a explicação sobre reservas", () => {
    renderWithProviders(<Dashboard />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Retiradas são presenciais; reservas expiram em 24h/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Como funciona a reserva" })
    ).toBeInTheDocument();
  });

  it("consulta os totais com limit 1", () => {
    renderWithProviders(<Dashboard />);

    expect(mockUseBooks).toHaveBeenCalledWith({ page: 1, limit: 1 });
    expect(mockUseCopies).toHaveBeenCalledWith({
      page: 1,
      limit: 1,
      status: "AVAILABLE",
    });
    expect(mockUseReservations).toHaveBeenCalledWith({
      page: 1,
      limit: 1,
      status: "PENDING",
    });
    expect(mockUseUsers).toHaveBeenCalledWith(1, 1);
  });

  it("exibe os totais para um usuário comum", () => {
    mockTotals({ books: 42, copies: 7, reservations: 3 });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Total de livros")).toBeInTheDocument();
    expect(screen.getByText("Cópias disponíveis")).toBeInTheDocument();
    expect(screen.getByText("Minhas reservas pendentes")).toBeInTheDocument();
    expect(screen.queryByText("Total de usuários")).not.toBeInTheDocument();
  });

  it("exibe o total de usuários apenas para administradores", () => {
    mockUseAuth.mockReturnValue(createAdminAuth());
    mockTotals({ users: 17 });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText("Total de usuários")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Administrar" })).toHaveAttribute(
      "href",
      "/users"
    );
  });

  it("mostra skeletons enquanto os dados carregam", () => {
    mockUseBooks.mockReturnValue(loadingQuery() as never);
    mockUseCopies.mockReturnValue(loadingQuery() as never);
    mockUseReservations.mockReturnValue(loadingQuery() as never);
    mockUseUsers.mockReturnValue(loadingQuery() as never);

    const { container } = renderWithProviders(<Dashboard />);

    expect(screen.queryByText("Total de livros")).not.toBeInTheDocument();
    expect(
      container.querySelectorAll(".animate-pulse").length
    ).toBeGreaterThan(0);
  });

  it("usa travessão quando um total está indisponível", () => {
    mockUseBooks.mockReturnValue(
      successfulQuery(undefined as never) as never
    );

    renderWithProviders(<Dashboard />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
