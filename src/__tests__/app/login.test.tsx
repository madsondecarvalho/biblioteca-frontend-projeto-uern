import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import LoginPage from "@/app/login/page";
import { useAuth } from "@/lib/auth-context";
import { createAuthState } from "@/test/fixtures";
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

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockToast = vi.mocked(toast);

describe("Tela de login", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(createAuthState());
  });

  it("renderiza o formulário de acesso", () => {
    renderWithProviders(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "Biblioteca UERN" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("voce@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("valida email e senha obrigatórios", async () => {
    const auth = createAuthState();
    mockUseAuth.mockReturnValue(auth);

    const { user } = renderWithProviders(<LoginPage />);
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Email inválido")).toBeInTheDocument();
    expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("não envia email com formato inválido", async () => {
    const auth = createAuthState();
    mockUseAuth.mockReturnValue(auth);

    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByPlaceholderText("voce@email.com"), "a@b");
    await user.type(screen.getByPlaceholderText("••••••"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Email inválido")).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("faz login e redireciona para o dashboard", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(createAuthState({ login }));

    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByPlaceholderText("voce@email.com"), "maria@uern.br");
    await user.type(screen.getByPlaceholderText("••••••"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "maria@uern.br",
        password: "senha123",
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Login realizado com sucesso");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("exibe a mensagem da API quando as credenciais são inválidas", async () => {
    const login = vi.fn().mockRejectedValue({
      response: { status: 401, data: { error: "Email ou senha inválidos" } },
    });
    mockUseAuth.mockReturnValue(createAuthState({ login }));

    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByPlaceholderText("voce@email.com"), "maria@uern.br");
    await user.type(screen.getByPlaceholderText("••••••"), "errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Email ou senha inválidos")
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("orienta sobre erro 405 de configuração da API", async () => {
    const login = vi.fn().mockRejectedValue({ response: { status: 405 } });
    mockUseAuth.mockReturnValue(createAuthState({ login }));

    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByPlaceholderText("voce@email.com"), "maria@uern.br");
    await user.type(screen.getByPlaceholderText("••••••"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining("Erro 405")
      )
    );
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_API_URL")
    );
  });

  it("redireciona usuário já autenticado para o dashboard", async () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        user: {
          id: 2,
          name: "Maria Leitora",
          email: "maria@uern.br",
          role: "user",
        },
        token: "fake-token",
        isAuthenticated: true,
      })
    );

    renderWithProviders(<LoginPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });
});
