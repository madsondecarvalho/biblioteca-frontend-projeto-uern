// Tipos gerados fielmente a partir de docs/swagger.json (Biblioteca API 1.0.0)

export type Role = "user" | "admin";

export type CopyStatus =
  | "AVAILABLE"
  | "BORROWED"
  | "MAINTENANCE"
  | "LOST"
  | "RESERVED";

export type ReservationStatus =
  | "PENDING"
  | "PICKED_UP"
  | "CANCELLED"
  | "EXPIRED";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface Author {
  id: number;
  name: string;
}

export interface AuthorInput {
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface CategoryInput {
  name: string;
}

export interface Book {
  id: number;
  title: string;
  year: number;
  authorId: number;
  Author?: Author;
  categoryId?: number | null;
  Category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookInput {
  title: string;
  authorId: number;
  year: number;
  categoryId?: number | null;
}

export interface Copy {
  id: number;
  code: string;
  status: CopyStatus;
  bookId: number;
  Book?: Book;
  createdAt?: string;
  updatedAt?: string;
}

export interface CopyInput {
  code: string;
  bookId: number;
  status?: CopyStatus;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Reservation {
  id: number;
  userId: number;
  User?: User;
  copyId: number;
  Copy?: Copy;
  status: ReservationStatus;
  reservedAt?: string;
  expiresAt?: string;
  pickedUpAt?: string | null;
  returnedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationInput {
  copyId: number;
}

export interface ApiError {
  error: string;
  issues?: { field: string; message: string }[];
}

export function getApiErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: ApiError }; message?: string };
    if (e.response?.data?.error) {
      const issues = e.response.data.issues;
      if (issues && issues.length > 0) {
        return `${e.response.data.error}: ${issues
          .map((i) => `${i.field}: ${i.message}`)
          .join("; ")}`;
      }
      return e.response.data.error;
    }
    if (e.message) return e.message;
  }
  return fallback;
}
