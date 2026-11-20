import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import {
  createAuthor,
  createBook,
  createCategory,
  createCopy,
  createReservation,
  createUser,
  deleteAuthor,
  deleteBook,
  deleteCategory,
  deleteCopy,
  deleteReservation,
  deleteUser,
  getAuthor,
  getBook,
  getCategory,
  getCopy,
  getReservation,
  getUser,
  listAuthors,
  listBooks,
  listCategories,
  listCopies,
  listReservations,
  listUsers,
  login,
  updateAuthor,
  updateBook,
  updateCategory,
  updateCopy,
  updateReservationStatus,
  updateUser,
} from "@/lib/services";
import {
  authorMachado,
  bookDomCasmurro,
  categoryRomance,
  copyAvailable,
  regularUser,
  reservationsPage,
} from "@/test/fixtures";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

describe("services", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ data: {} } as never);
    mockPost.mockResolvedValue({ data: {} } as never);
    mockPut.mockResolvedValue({ data: {} } as never);
    mockDelete.mockResolvedValue({ data: {} } as never);
  });

  it("login envia POST /login e retorna token/usuário", async () => {
    mockPost.mockResolvedValue({
      data: { token: "jwt", user: regularUser },
    } as never);

    const result = await login({
      email: "maria@uern.br",
      password: "senha123",
    });

    expect(mockPost).toHaveBeenCalledWith("/login", {
      email: "maria@uern.br",
      password: "senha123",
    });
    expect(result).toEqual({ token: "jwt", user: regularUser });
  });

  it("books: lista com filtros e executa CRUD", async () => {
    mockGet.mockResolvedValue({ data: { data: [] } } as never);
    mockPost.mockResolvedValue({ data: bookDomCasmurro } as never);
    mockPut.mockResolvedValue({ data: bookDomCasmurro } as never);

    await listBooks();
    expect(mockGet).toHaveBeenCalledWith("/books?page=1&limit=10");

    await listBooks({ page: 2, limit: 5, categoryId: 3, authorId: 4 });
    expect(mockGet).toHaveBeenLastCalledWith(
      "/books?page=2&limit=5&categoryId=3&authorId=4"
    );

    await getBook(1);
    expect(mockGet).toHaveBeenLastCalledWith("/books/1");

    const input = { title: "Dom Casmurro", authorId: 1, year: 1899 };
    await createBook(input);
    expect(mockPost).toHaveBeenCalledWith("/books", input);

    await updateBook(1, input);
    expect(mockPut).toHaveBeenCalledWith("/books/1", input);

    await deleteBook(1);
    expect(mockDelete).toHaveBeenCalledWith("/books/1");
  });

  it("authors: lista, busca e executa CRUD", async () => {
    mockGet.mockResolvedValue({ data: {} } as never);
    mockPost.mockResolvedValue({ data: authorMachado } as never);
    mockPut.mockResolvedValue({ data: authorMachado } as never);

    await listAuthors(2, 5);
    expect(mockGet).toHaveBeenCalledWith("/authors?page=2&limit=5");

    await getAuthor(1);
    expect(mockGet).toHaveBeenLastCalledWith("/authors/1");

    await createAuthor({ name: "Machado de Assis" });
    expect(mockPost).toHaveBeenCalledWith("/authors", {
      name: "Machado de Assis",
    });

    await updateAuthor(1, { name: "Machado" });
    expect(mockPut).toHaveBeenCalledWith("/authors/1", { name: "Machado" });

    await deleteAuthor(1);
    expect(mockDelete).toHaveBeenCalledWith("/authors/1");
  });

  it("categories: lista, busca e executa CRUD", async () => {
    mockGet.mockResolvedValue({ data: {} } as never);
    mockPost.mockResolvedValue({ data: categoryRomance } as never);
    mockPut.mockResolvedValue({ data: categoryRomance } as never);

    await listCategories(3, 10);
    expect(mockGet).toHaveBeenCalledWith("/categories?page=3&limit=10");

    await getCategory(1);
    expect(mockGet).toHaveBeenLastCalledWith("/categories/1");

    await createCategory({ name: "Romance" });
    expect(mockPost).toHaveBeenCalledWith("/categories", { name: "Romance" });

    await updateCategory(1, { name: "Drama" });
    expect(mockPut).toHaveBeenCalledWith("/categories/1", { name: "Drama" });

    await deleteCategory(1);
    expect(mockDelete).toHaveBeenCalledWith("/categories/1");
  });

  it("copies: lista com filtros e executa CRUD", async () => {
    mockGet.mockResolvedValue({ data: {} } as never);
    mockPost.mockResolvedValue({ data: copyAvailable } as never);
    mockPut.mockResolvedValue({ data: copyAvailable } as never);

    await listCopies();
    expect(mockGet).toHaveBeenCalledWith("/copies?page=1&limit=10");

    await listCopies({
      page: 2,
      limit: 5,
      bookId: 1,
      status: "AVAILABLE",
    });
    expect(mockGet).toHaveBeenLastCalledWith(
      "/copies?page=2&limit=5&bookId=1&status=AVAILABLE"
    );

    await getCopy(11);
    expect(mockGet).toHaveBeenLastCalledWith("/copies/11");

    const input = { code: "BC-010", bookId: 1, status: "AVAILABLE" as const };
    await createCopy(input);
    expect(mockPost).toHaveBeenCalledWith("/copies", input);

    await updateCopy(11, input);
    expect(mockPut).toHaveBeenCalledWith("/copies/11", input);

    await deleteCopy(11);
    expect(mockDelete).toHaveBeenCalledWith("/copies/11");
  });

  it("reservations: lista com filtros, busca, cria, atualiza status e exclui", async () => {
    mockGet.mockResolvedValue({ data: reservationsPage } as never);
    mockPost.mockResolvedValue({ data: {} } as never);
    mockPut.mockResolvedValue({ data: {} } as never);

    await listReservations();
    expect(mockGet).toHaveBeenCalledWith("/reservations?page=1&limit=10");

    await listReservations({ page: 2, limit: 5, status: "PENDING" });
    expect(mockGet).toHaveBeenLastCalledWith(
      "/reservations?page=2&limit=5&status=PENDING"
    );

    await getReservation(101);
    expect(mockGet).toHaveBeenLastCalledWith("/reservations/101");

    await createReservation({ copyId: 11 });
    expect(mockPost).toHaveBeenCalledWith("/reservations", { copyId: 11 });

    await updateReservationStatus(101, "PICKED_UP");
    expect(mockPut).toHaveBeenCalledWith("/reservations/101", {
      status: "PICKED_UP",
    });

    await deleteReservation(101);
    expect(mockDelete).toHaveBeenCalledWith("/reservations/101");
  });

  it("users: lista, busca e executa CRUD", async () => {
    mockGet.mockResolvedValue({ data: {} } as never);
    mockPost.mockResolvedValue({ data: regularUser } as never);
    mockPut.mockResolvedValue({ data: regularUser } as never);

    await listUsers(2, 5);
    expect(mockGet).toHaveBeenCalledWith("/users?page=2&limit=5");

    await getUser(2);
    expect(mockGet).toHaveBeenLastCalledWith("/users/2");

    await createUser({
      name: "Maria",
      email: "maria@uern.br",
      password: "senha123",
    });
    expect(mockPost).toHaveBeenCalledWith("/users", {
      name: "Maria",
      email: "maria@uern.br",
      password: "senha123",
    });

    await updateUser(2, { name: "Maria Leitora" });
    expect(mockPut).toHaveBeenCalledWith("/users/2", {
      name: "Maria Leitora",
    });

    await deleteUser(2);
    expect(mockDelete).toHaveBeenCalledWith("/users/2");
  });
});
