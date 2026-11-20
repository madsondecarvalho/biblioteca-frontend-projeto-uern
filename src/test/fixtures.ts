import { vi } from "vitest";
import type {
  Author,
  Book,
  Category,
  Copy,
  LoginInput,
  Paginated,
  Pagination,
  Reservation,
  User,
} from "@/lib/types";

export const adminUser: User = {
  id: 1,
  name: "Admin UERN",
  email: "admin@uern.br",
  role: "admin",
};

export const regularUser: User = {
  id: 2,
  name: "Maria Leitora",
  email: "maria@uern.br",
  role: "user",
};

export const authorMachado: Author = { id: 1, name: "Machado de Assis" };
export const authorClarice: Author = { id: 2, name: "Clarice Lispector" };

export const categoryRomance: Category = { id: 1, name: "Romance" };
export const categoryDrama: Category = { id: 2, name: "Drama" };

export const bookDomCasmurro: Book = {
  id: 1,
  title: "Dom Casmurro",
  year: 1899,
  authorId: 1,
  Author: authorMachado,
  categoryId: 1,
  Category: categoryRomance,
  updatedAt: "2025-01-15T13:00:00.000Z",
};

export const bookHoraDaEstrela: Book = {
  id: 2,
  title: "A Hora da Estrela",
  year: 1977,
  authorId: 2,
  Author: authorClarice,
  categoryId: null,
  Category: null,
  updatedAt: "2025-02-10T10:30:00.000Z",
};

export function makePagination(
  overrides: Partial<Pagination> = {}
): Pagination {
  return {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
    ...overrides,
  };
}

export function makePage<T>(
  data: T[],
  pagination: Partial<Pagination> = {}
): Paginated<T> {
  return {
    data,
    pagination: makePagination({
      total: data.length,
      ...pagination,
    }),
  };
}

export const authorsPage = makePage([authorMachado, authorClarice]);
export const categoriesPage = makePage([categoryRomance, categoryDrama]);
export const booksPage = makePage([bookDomCasmurro, bookHoraDaEstrela]);

export const copyAvailable: Copy = {
  id: 11,
  code: "BC-001",
  status: "AVAILABLE",
  bookId: 1,
  Book: bookDomCasmurro,
  updatedAt: "2025-01-20T09:00:00.000Z",
};

export const copyBorrowed: Copy = {
  id: 12,
  code: "BC-002",
  status: "BORROWED",
  bookId: 1,
  Book: bookDomCasmurro,
  updatedAt: "2025-01-21T09:00:00.000Z",
};

export const copiesPage = makePage([copyAvailable, copyBorrowed]);

export const reservationsPage = makePage<Reservation>([
  {
    id: 101,
    userId: 2,
    User: regularUser,
    copyId: 11,
    Copy: copyAvailable,
    status: "PENDING",
    reservedAt: "2025-03-01T12:00:00.000Z",
    expiresAt: "2025-03-02T12:00:00.000Z",
  },
  {
    id: 102,
    userId: 2,
    User: regularUser,
    copyId: 12,
    Copy: copyBorrowed,
    status: "PICKED_UP",
    reservedAt: "2025-02-01T12:00:00.000Z",
    expiresAt: "2025-02-02T12:00:00.000Z",
  },
]);

export const usersPage = makePage([adminUser, regularUser]);

export function successfulQuery<T>(data: T) {
  return {
    data,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: true,
    isFetching: false,
    status: "success" as const,
    error: null,
    refetch: vi.fn(),
  };
}

export function loadingQuery() {
  return {
    data: undefined,
    isLoading: true,
    isPending: true,
    isError: false,
    isSuccess: false,
    isFetching: true,
    status: "pending" as const,
    error: null,
    refetch: vi.fn(),
  };
}

export function errorQuery(message = "Falha ao carregar") {
  return {
    data: undefined,
    isLoading: false,
    isPending: false,
    isError: true,
    isSuccess: false,
    isFetching: false,
    status: "error" as const,
    error: new Error(message),
    refetch: vi.fn(),
  };
}

export interface MockAuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

export function createAuthState(
  overrides: Partial<MockAuthState> = {}
): MockAuthState {
  return {
    user: null,
    token: null,
    isLoading: false,
    isAdmin: false,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

export function createAdminAuth(
  overrides: Partial<MockAuthState> = {}
): MockAuthState {
  return createAuthState({
    user: adminUser,
    token: "fake-token",
    isAdmin: true,
    isAuthenticated: true,
    ...overrides,
  });
}

export function createUserAuth(
  overrides: Partial<MockAuthState> = {}
): MockAuthState {
  return createAuthState({
    user: regularUser,
    token: "fake-token",
    isAuthenticated: true,
    ...overrides,
  });
}
