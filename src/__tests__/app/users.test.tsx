import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import UsersPage from "@/app/users/page";
import { useUsers } from "@/lib/hooks";
import { createUser, deleteUser, updateUser } from "@/lib/services";
import {
  adminUser,
  loadingQuery,
  makePage,
  regularUser,
  successfulQuery,
  usersPage,
} from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

vi.mock("@/components/guards", () => ({
  AdminGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/hooks", () => ({
  useUsers: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseUsers = vi.mocked(useUsers);
const mockCreateUser = vi.mocked(createUser);
const mockUpdateUser = vi.mocked(updateUser);
const mockDeleteUser = vi.mocked(deleteUser);
const mockToast = vi.mocked(toast);

describe("Tela de Usuários (admin)", () => {
  beforeEach(() => {
    mockUseUsers.mockReturnValue(successfulQuery(usersPage) as never);
    mockCreateUser.mockResolvedValue(regularUser);
    mockUpdateUser.mockResolvedValue(adminUser);
    mockDeleteUser.mockResolvedValue(undefined);
  });

  it("lista usuários com email e perfil", () => {
    renderWithProviders(<UsersPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Usuários (admin)" })
    ).toBeInTheDocument();
    expect(screen.getByText("Admin UERN")).toBeInTheDocument();
    expect(screen.getByText("admin@uern.br")).toBeInTheDocument();
    expect(screen.getByText("Maria Leitora")).toBeInTheDocument();
    expect(screen.getByText("maria@uern.br")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
  });

  it("exibe skeleton durante o carregamento", () => {
    mockUseUsers.mockReturnValue(loadingQuery() as never);

    const { container } = renderWithProviders(<UsersPage />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });

  it("cria um usuário pelo modal", async () => {
    const { user, queryClient } = renderWithProviders(<UsersPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "+ Novo Usuário" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Novo usuário" })
    ).toBeInTheDocument();

    await user.type(
      within(dialog).getByPlaceholderText("João Silva"),
      "João Silva"
    );
    await user.type(
      within(dialog).getByPlaceholderText("joao@email.com"),
      "joao@email.com"
    );
    await user.type(
      within(dialog).getByPlaceholderText("senha123"),
      "senha123"
    );
    await user.selectOptions(
      within(dialog).getByRole("combobox"),
      "admin"
    );
    await user.click(within(dialog).getByRole("button", { name: "Criar" }));

    await waitFor(() =>
      expect(mockCreateUser).toHaveBeenCalledWith({
        name: "João Silva",
        email: "joao@email.com",
        password: "senha123",
        role: "admin",
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Usuário criado");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("valida os campos obrigatórios ao criar usuário", async () => {
    const { user } = renderWithProviders(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "+ Novo Usuário" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Criar" })
    );

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("valida formato de email e tamanho da senha", async () => {
    const { user } = renderWithProviders(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "+ Novo Usuário" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("João Silva"), "João");
    await user.type(
      within(dialog).getByPlaceholderText("joao@email.com"),
      "joao-invalido"
    );
    await user.type(within(dialog).getByPlaceholderText("senha123"), "123");
    await user.click(within(dialog).getByRole("button", { name: "Criar" }));

    expect(await screen.findByText("Email inválido")).toBeInTheDocument();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("edita um usuário enviando apenas os campos informados", async () => {
    const { user, queryClient } = renderWithProviders(<UsersPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Editar usuário #1" })
    ).toBeInTheDocument();

    const nameInput = within(dialog).getByPlaceholderText("Nome");
    expect(nameInput).toHaveValue("Admin UERN");
    await user.clear(nameInput);
    await user.type(nameInput, "Admin Master");
    await user.clear(within(dialog).getByPlaceholderText("Email"));
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith(1, {
        name: "Admin Master",
        role: "admin",
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Usuário atualizado");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("envia nova senha quando informada na edição", async () => {
    const { user } = renderWithProviders(<UsersPage />);

    await user.click(screen.getAllByRole("button", { name: "Editar" })[1]);
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByPlaceholderText("Nova senha (opcional)"),
      "novaSenha123"
    );
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith(2, {
        name: "Maria Leitora",
        email: "maria@uern.br",
        password: "novaSenha123",
        role: "user",
      })
    );
  });

  it("exibe erro da API ao falhar a criação", async () => {
    mockCreateUser.mockRejectedValue({
      response: { data: { error: "Email já cadastrado" } },
    });
    const { user } = renderWithProviders(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "+ Novo Usuário" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("João Silva"), "João");
    await user.type(
      within(dialog).getByPlaceholderText("joao@email.com"),
      "joao@email.com"
    );
    await user.type(
      within(dialog).getByPlaceholderText("senha123"),
      "senha123"
    );
    await user.click(within(dialog).getByRole("button", { name: "Criar" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Email já cadastrado")
    );
  });

  it("remove um usuário após confirmação", async () => {
    const { user } = renderWithProviders(<UsersPage />);

    await user.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Remover usuário" })
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalledWith(1));
    expect(mockToast.success).toHaveBeenCalledWith("Usuário removido");
  });

  it("navega para a próxima página", async () => {
    mockUseUsers.mockReturnValue(
      successfulQuery(makePage(usersPage.data, { totalPages: 2 })) as never
    );
    const { user } = renderWithProviders(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(mockUseUsers).toHaveBeenCalledWith(2, 10));
  });
});
