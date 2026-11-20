import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import {
  createAdminAuth,
  createUserAuth,
} from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

const { pathname, push } = vi.hoisted(() => ({
  pathname: { current: "/" },
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe("Componente AppShell", () => {
  beforeEach(() => {
    pathname.current = "/";
    mockUseAuth.mockReturnValue(createUserAuth());
  });

  it("não renderiza a navegação na página de login", () => {
    pathname.current = "/login";

    renderWithProviders(
      <AppShell>
        <p>Formulário de login</p>
      </AppShell>
    );

    expect(screen.getByText("Formulário de login")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Dashboard" })
    ).not.toBeInTheDocument();
  });

  it("renderiza a navegação e os dados do usuário autenticado", () => {
    renderWithProviders(
      <AppShell>
        <p>Conteúdo da página</p>
      </AppShell>
    );

    expect(screen.getByText("Conteúdo da página")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Dashboard" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Livros" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Autores" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Categorias" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Cópias" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Reservas" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Usuários" })).not.toBeInTheDocument();
    expect(screen.getByText("Maria Leitora")).toBeInTheDocument();
    expect(screen.getByText("maria@uern.br — Usuário")).toBeInTheDocument();
  });

  it("exibe o link de usuários apenas para administradores", () => {
    mockUseAuth.mockReturnValue(createAdminAuth());

    renderWithProviders(
      <AppShell>
        <p>Conteúdo da página</p>
      </AppShell>
    );

    expect(screen.getAllByRole("link", { name: "Usuários" })).toHaveLength(2);
    expect(screen.getByText("admin@uern.br — Admin")).toBeInTheDocument();
  });

  it("destaca o link da rota ativa", () => {
    pathname.current = "/books/1";

    renderWithProviders(
      <AppShell>
        <p>Conteúdo da página</p>
      </AppShell>
    );

    const booksLinks = screen.getAllByRole("link", { name: "Livros" });
    expect(booksLinks[0].className).toContain("bg-zinc-900");
    const dashboardLink = screen.getAllByRole("link", {
      name: "Dashboard",
    })[0];
    expect(dashboardLink.className).not.toContain("bg-zinc-900");
  });

  it("encerra a sessão ao clicar em Sair", async () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue(createUserAuth({ logout }));

    const { user } = renderWithProviders(
      <AppShell>
        <p>Conteúdo da página</p>
      </AppShell>
    );

    const aside = screen.getByRole("complementary");
    await user.click(within(aside).getByRole("button", { name: "Sair" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/login");
  });
});
