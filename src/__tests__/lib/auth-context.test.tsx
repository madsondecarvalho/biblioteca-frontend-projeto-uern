import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth, useRequireAuth } from "@/lib/auth-context";
import { login as loginService } from "@/lib/services";
import { adminUser, regularUser } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace,
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/services", () => ({
  login: vi.fn(),
}));

const mockLoginService = vi.mocked(loginService);

function AuthConsumer() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="user">{auth.user?.name ?? "anônimo"}</span>
      <span data-testid="token">{auth.token ?? "sem-token"}</span>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="admin">{String(auth.isAdmin)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <button
        onClick={() => {
          void auth
            .login({ email: "maria@uern.br", password: "senha123" })
            .catch(() => undefined);
        }}
      >
        Entrar
      </button>
      <button onClick={auth.logout}>Sair</button>
    </div>
  );
}

function Guarded({ adminOnly = false }: { adminOnly?: boolean }) {
  const auth = useRequireAuth(adminOnly);
  return <span data-testid="guarded">{String(auth.isAuthenticated)}</span>;
}

function seedSession(user = regularUser) {
  window.localStorage.setItem("biblioteca:token", "token-salvo");
  window.localStorage.setItem("biblioteca:user", JSON.stringify(user));
}

describe("AuthContext", () => {
  beforeEach(() => {
    mockLoginService.mockResolvedValue({ token: "jwt-token", user: regularUser });
  });

  it("inicia sem sessão quando não há dados no localStorage", () => {
    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("anônimo");
    expect(screen.getByTestId("token")).toHaveTextContent("sem-token");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("admin")).toHaveTextContent("false");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("restaura a sessão salva no localStorage", () => {
    seedSession(adminUser);

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("Admin UERN");
    expect(screen.getByTestId("token")).toHaveTextContent("token-salvo");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("admin")).toHaveTextContent("true");
  });

  it("ignora usuário salvo com JSON corrompido", () => {
    window.localStorage.setItem("biblioteca:token", "token");
    window.localStorage.setItem("biblioteca:user", "{invalido");

    renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("anônimo");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("faz login, persiste a sessão e atualiza o estado", async () => {
    const { user } = renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("Maria Leitora")
    );
    expect(mockLoginService).toHaveBeenCalledWith({
      email: "maria@uern.br",
      password: "senha123",
    });
    expect(window.localStorage.getItem("biblioteca:token")).toBe("jwt-token");
    expect(
      JSON.parse(window.localStorage.getItem("biblioteca:user") ?? "{}").email
    ).toBe("maria@uern.br");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("admin")).toHaveTextContent("false");
  });

  it("mantém o usuário deslogado quando o login falha", async () => {
    mockLoginService.mockRejectedValue(new Error("credenciais inválidas"));
    const { user } = renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mockLoginService).toHaveBeenCalled());
    expect(screen.getByTestId("user")).toHaveTextContent("anônimo");
    expect(window.localStorage.getItem("biblioteca:token")).toBeNull();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("encerra a sessão e redireciona para o login", async () => {
    seedSession();

    const { user } = renderWithProviders(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(window.localStorage.getItem("biblioteca:token")).toBeNull();
    expect(window.localStorage.getItem("biblioteca:user")).toBeNull();
    expect(screen.getByTestId("user")).toHaveTextContent("anônimo");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("lança erro quando useAuth é usado fora do provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderWithProviders(<AuthConsumer />)
    ).toThrow("useAuth deve ser usado dentro de AuthProvider");

    consoleSpy.mockRestore();
  });
});

describe("useRequireAuth", () => {
  it("redireciona para /login quando não há autenticação", async () => {
    renderWithProviders(
      <AuthProvider>
        <Guarded />
      </AuthProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("redireciona usuário comum para / em rota administrativa", async () => {
    seedSession(regularUser);

    renderWithProviders(
      <AuthProvider>
        <Guarded adminOnly />
      </AuthProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("mantém administrador em rota administrativa", async () => {
    seedSession(adminUser);

    renderWithProviders(
      <AuthProvider>
        <Guarded adminOnly />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("guarded")).toHaveTextContent("true")
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("não redireciona usuário autenticado em rota comum", async () => {
    seedSession(regularUser);

    renderWithProviders(
      <AuthProvider>
        <Guarded />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("guarded")).toHaveTextContent("true")
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
