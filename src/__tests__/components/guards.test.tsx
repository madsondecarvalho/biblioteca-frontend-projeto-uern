import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AdminGuard, RequireAuth } from "@/components/guards";
import { useRequireAuth } from "@/lib/auth-context";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/auth-context", () => ({
  useRequireAuth: vi.fn(),
}));

const mockUseRequireAuth = vi.mocked(useRequireAuth);

describe("Guards de autenticação", () => {
  beforeEach(() => {
    mockUseRequireAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
    } as never);
  });

  describe("RequireAuth", () => {
    it("renderiza o conteúdo quando o usuário está autenticado", () => {
      renderWithProviders(
        <RequireAuth>
          <p>Conteúdo protegido</p>
        </RequireAuth>
      );

      expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
      expect(mockUseRequireAuth).toHaveBeenCalledWith(false);
    });

    it("mostra carregamento enquanto a sessão é verificada", () => {
      mockUseRequireAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      } as never);

      renderWithProviders(
        <RequireAuth>
          <p>Conteúdo protegido</p>
        </RequireAuth>
      );

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
      expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
    });

    it("não renderiza o conteúdo sem autenticação", () => {
      mockUseRequireAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      } as never);

      renderWithProviders(
        <RequireAuth>
          <p>Conteúdo protegido</p>
        </RequireAuth>
      );

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
      expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
    });
  });

  describe("AdminGuard", () => {
    it("renderiza o conteúdo para administradores", () => {
      mockUseRequireAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true,
      } as never);

      renderWithProviders(
        <AdminGuard>
          <p>Área administrativa</p>
        </AdminGuard>
      );

      expect(screen.getByText("Área administrativa")).toBeInTheDocument();
      expect(mockUseRequireAuth).toHaveBeenCalledWith(true);
    });

    it("bloqueia usuários comuns", () => {
      mockUseRequireAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      } as never);

      renderWithProviders(
        <AdminGuard>
          <p>Área administrativa</p>
        </AdminGuard>
      );

      expect(screen.getByText("Verificando permissão...")).toBeInTheDocument();
      expect(
        screen.queryByText("Área administrativa")
      ).not.toBeInTheDocument();
    });

    it("bloqueia enquanto carrega ou sem sessão", () => {
      mockUseRequireAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      } as never);

      renderWithProviders(
        <AdminGuard>
          <p>Área administrativa</p>
        </AdminGuard>
      );

      expect(screen.getByText("Verificando permissão...")).toBeInTheDocument();
    });
  });
});
