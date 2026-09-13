import { api, buildQuery } from "./api";
import type {
  Author,
  AuthorInput,
  Book,
  BookInput,
  Category,
  CategoryInput,
  Copy,
  CopyInput,
  CopyStatus,
  LoginInput,
  LoginResponse,
  Paginated,
  Reservation,
  ReservationInput,
  ReservationStatus,
  User,
  UserInput,
  UserUpdateInput,
} from "./types";

// ---------- Auth ----------
export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/login", input);
  return data;
}

// ---------- Books ----------
export interface BookFilters {
  page?: number;
  limit?: number;
  categoryId?: number;
  authorId?: number;
}

export async function listBooks(filters: BookFilters = {}) {
  const { data } = await api.get<Paginated<Book>>(
    `/books${buildQuery({ page: 1, limit: 10, ...filters })}`
  );
  return data;
}

export async function getBook(id: number | string) {
  const { data } = await api.get<Book>(`/books/${id}`);
  return data;
}

export async function createBook(input: BookInput) {
  const { data } = await api.post<Book>("/books", input);
  return data;
}

export async function updateBook(id: number | string, input: BookInput) {
  const { data } = await api.put<Book>(`/books/${id}`, input);
  return data;
}

export async function deleteBook(id: number | string) {
  await api.delete(`/books/${id}`);
}

// ---------- Authors ----------
export async function listAuthors(page = 1, limit = 10) {
  const { data } = await api.get<Paginated<Author>>(
    `/authors${buildQuery({ page, limit })}`
  );
  return data;
}

export async function getAuthor(id: number | string) {
  const { data } = await api.get<Author>(`/authors/${id}`);
  return data;
}

export async function createAuthor(input: AuthorInput) {
  const { data } = await api.post<Author>("/authors", input);
  return data;
}

export async function updateAuthor(id: number | string, input: AuthorInput) {
  const { data } = await api.put<Author>(`/authors/${id}`, input);
  return data;
}

export async function deleteAuthor(id: number | string) {
  await api.delete(`/authors/${id}`);
}

// ---------- Categories ----------
export async function listCategories(page = 1, limit = 10) {
  const { data } = await api.get<Paginated<Category>>(
    `/categories${buildQuery({ page, limit })}`
  );
  return data;
}

export async function getCategory(id: number | string) {
  const { data } = await api.get<Category>(`/categories/${id}`);
  return data;
}

export async function createCategory(input: CategoryInput) {
  const { data } = await api.post<Category>("/categories", input);
  return data;
}

export async function updateCategory(id: number | string, input: CategoryInput) {
  const { data } = await api.put<Category>(`/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: number | string) {
  await api.delete(`/categories/${id}`);
}

// ---------- Copies ----------
export interface CopyFilters {
  page?: number;
  limit?: number;
  bookId?: number;
  status?: CopyStatus;
}

export async function listCopies(filters: CopyFilters = {}) {
  const { data } = await api.get<Paginated<Copy>>(
    `/copies${buildQuery({ page: 1, limit: 10, ...filters })}`
  );
  return data;
}

export async function getCopy(id: number | string) {
  const { data } = await api.get<Copy>(`/copies/${id}`);
  return data;
}

export async function createCopy(input: CopyInput) {
  const { data } = await api.post<Copy>("/copies", input);
  return data;
}

export async function updateCopy(id: number | string, input: CopyInput) {
  const { data } = await api.put<Copy>(`/copies/${id}`, input);
  return data;
}

export async function deleteCopy(id: number | string) {
  await api.delete(`/copies/${id}`);
}

// ---------- Reservations ----------
export interface ReservationFilters {
  page?: number;
  limit?: number;
  status?: ReservationStatus;
}

export async function listReservations(filters: ReservationFilters = {}) {
  const { data } = await api.get<Paginated<Reservation>>(
    `/reservations${buildQuery({ page: 1, limit: 10, ...filters })}`
  );
  return data;
}

export async function getReservation(id: number | string) {
  const { data } = await api.get<Reservation>(`/reservations/${id}`);
  return data;
}

export async function createReservation(input: ReservationInput) {
  const { data } = await api.post<Reservation>("/reservations", input);
  return data;
}

export async function updateReservationStatus(
  id: number | string,
  status: "PICKED_UP" | "CANCELLED" | "EXPIRED"
) {
  const { data } = await api.put<Reservation>(`/reservations/${id}`, {
    status,
  });
  return data;
}

export async function deleteReservation(id: number | string) {
  await api.delete(`/reservations/${id}`);
}

// ---------- Users ----------
export async function listUsers(page = 1, limit = 10) {
  const { data } = await api.get<Paginated<User>>(
    `/users${buildQuery({ page, limit })}`
  );
  return data;
}

export async function getUser(id: number | string) {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(input: UserInput) {
  const { data } = await api.post<User>("/users", input);
  return data;
}

export async function updateUser(id: number | string, input: UserUpdateInput) {
  const { data } = await api.put<User>(`/users/${id}`, input);
  return data;
}

export async function deleteUser(id: number | string) {
  await api.delete(`/users/${id}`);
}
